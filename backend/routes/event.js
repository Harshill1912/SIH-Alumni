import express from "express";
import Event from "../models/Event.js";
import Alumni from "../models/Alumni.js";
import nodemailer from "nodemailer";

const router=express.Router();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1]; // Remove "Bearer " prefix
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

router.post("/",verifyToken,async(req,res)=>{
try {
    const alumni=await Alumni.findById(req.userId);
    if(!alumni || alumni.status !== 'approved'){
        return res.status(403).json({error:"only approved alumni can create events"})
    }

    const event=new Event({
        ...req.body,
        createdBy:req.userId
    });
    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

// all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "name email company");
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all events created by the logged-in alumni
router.get("/my/events", verifyToken, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.userId }).sort({ startDate: 1 });

    if (events.length === 0) {
      return res.status(200).json({ message: "No events created yet", events: [] });
    }

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get past events attended by the logged-in alumni
router.get("/my/attended", verifyToken, async (req, res) => {
  try {
    const now = new Date();

    // Find events where this alumni is in participants list with status "attended"
    const events = await Event.find({
      "participants.alumniId": req.userId,
      "participants.status": "attended",
      startDate: { $lt: now }  // only past events
    }).select("title location startDate endDate participants");

    // Filter participant info for logged-in user
    const attendedEvents = events.map(event => {
      const participant = event.participants.find(
        p => p.alumniId.toString() === req.userId
      );

      return {
        eventId: event._id,
        title: event.title,
        location: event.location,
        date: event.startDate,
        status: participant?.status || "unknown"
      };
    });

    res.status(200).json(attendedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update Event
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    Object.assign(event, req.body);
    await event.save();
    res.status(200).json({ message: "Event updated", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete Event
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await event.remove();
    res.status(200).json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/rsvp", verifyToken, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId);
    if (!alumni || alumni.status !== "approved")
      return res.status(403).json({ error: "Only approved alumni can RSVP" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Check capacity
    if (event.participants.length >= event.maxCapacity)
      return res.status(400).json({ error: "Event is full" });

    // Check if already registered
    const alreadyRegistered = event.participants.some(
      (p) => p.alumniId.toString() === req.userId
    );
    if (alreadyRegistered)
      return res.status(400).json({ error: "Already registered" });

    // Add participant
    event.participants.push({
      alumniId: req.userId,
      email: alumni.email,
      name: alumni.name,
    });

    await event.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: alumni.email,
      subject: `Registration Confirmed: ${event.title}`,
      text: `Hi ${alumni.name},\n\nYou have successfully registered for the event: ${event.title} at ${event.location} on ${event.startDate}.\n\nThank you!`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "RSVP successful, confirmation email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id/participants", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "participants.alumniId",
      "name email company"
    );
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Only creator or admin can view
    if (event.createdBy.toString() !== req.userId && req.userRole !== "admin")
      return res.status(403).json({ error: "Not authorized" });

    res.status(200).json(event.participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send update/reminder to participants
router.post("/:id/notify", verifyToken, async (req, res) => {
  try {
    // Only admin or event creator can send updates
    const event = await Event.findById(req.params.id).populate("participants.alumniId", "name email");
    if (!event) return res.status(404).json({ error: "Event not found" });


    if (req.userRole !== "admin" && event.createdBy.toString() !== req.userId)
      return res.status(403).json({ error: "Not authorized to send notifications" });

    const { message } = req.body; // Custom message

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send emails to all participants
    for (const participant of event.participants) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: participant.email,
        subject: `Update for Event: ${event.title}`,
        text: `Hi ${participant.name},\n\n${message}\n\nEvent Details:\nTitle: ${event.title}\nLocation: ${event.location}\nDate: ${event.startDate}\n\nThank you!`,
      });
    }

    res.status(200).json({ message: "Notifications sent to all participants" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//automatic reminders
cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();

    // Find events that are 7 days or 1 day away
    const upcomingEvents = await Event.find({
      startDate: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8) // next 8 days
      }
    }).populate("participants.alumniId", "name email");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    for (const event of upcomingEvents) {
      const diffDays = Math.ceil((event.startDate - now) / (1000 * 60 * 60 * 24));

      // Only send reminder if 7 days or 1 day before
      if (diffDays === 7 || diffDays === 1) {
        for (const participant of event.participants) {
          if (participant.status === "registered") {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: participant.email,
              subject: `Reminder: Event ${event.title} in ${diffDays} day(s)`,
              text: `Hi ${participant.name},\n\nThis is a reminder for the event "${event.title}" at ${event.location} on ${event.startDate}.\n\nThank you!`,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error sending reminders:", err.message);
  }
});


router.put("/:id/cancel", verifyToken, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const participant = event.participants.find(p => p.alumniId.toString() === req.userId);
  if (!participant) return res.status(400).json({ error: "You are not registered" });

  participant.status = "canceled";
  await event.save();
  res.json({ message: "RSVP canceled" });
});


router.put("/:id/attendance/:participantId", verifyAdmin, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  const participant = event.participants.id(req.params.participantId);
  if (!participant) return res.status(404).json({ error: "Participant not found" });

  participant.status = "attended";
  await event.save();
  res.json({ message: "Attendance marked" });
});


export default router;  

