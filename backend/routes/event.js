import express from "express";
import Event from "../models/Event.js";
import Alumni from "../models/Alumni.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import corn from "node-cron";

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Middleware to verify admin (example)
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
};

// ---------------- CREATE EVENT ----------------
router.post("/", verifyToken, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId);
    if (!alumni || alumni.status !== "approved")
      return res.status(403).json({ error: "Only approved alumni can create events" });

    const { mode, location, meetingLink } = req.body;

    // Validation based on mode
    if (mode === "online" && !meetingLink)
      return res.status(400).json({ error: "Online events require a meeting link" });
    if (mode === "offline" && !location)
      return res.status(400).json({ error: "Offline events require a location" });

    const event = new Event({
      ...req.body,
      organizedBy: req.userId
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- GET ALL EVENTS ----------------
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().populate("organizedBy", "name email company");
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- GET EVENTS CREATED BY LOGGED-IN ALUMNI ----------------
router.get("/my/events", verifyToken, async (req, res) => {
  try {
    const events = await Event.find({ organizedBy: req.userId }).sort({ startDate: 1 });
    res.status(200).json(events.length ? events : { message: "No events created yet", events: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- RSVP ----------------
router.post("/:id/rsvp", verifyToken, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId);
    if (!alumni || alumni.status !== "approved")
      return res.status(403).json({ error: "Only approved alumni can RSVP" });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.rsvp.length >= event.maxCapacity) return res.status(400).json({ error: "Event is full" });

    const alreadyRegistered = event.rsvp.some(r => r.alumniId.toString() === req.userId);
    if (alreadyRegistered) return res.status(400).json({ error: "Already registered" });

    event.rsvp.push({
      alumniId: req.userId,
      email: alumni.email,
      name: alumni.name
    });

    await event.save();

    let locationText = "";
    if (event.mode === "online") locationText = `Join online at: ${event.meetingLink}`;
    else if (event.mode === "offline") locationText = `Location: ${event.location}`;
    else if (event.mode === "hybrid") locationText = `Location: ${event.location}\nOnline link: ${event.meetingLink}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: alumni.email,
      subject: `Registration Confirmed: ${event.title}`,
      text: `Hi ${alumni.name},\n\nYou have successfully registered for the event: ${event.title}.\n${locationText}\nDate: ${event.startDate}\n\nThank you!`
    });

    res.status(200).json({ message: "RSVP successful, confirmation email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- GET PARTICIPANTS ----------------
router.get("/:id/participants", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("rsvp.alumniId", "name email company");
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.organizedBy.toString() !== req.userId && req.userRole !== "admin")
      return res.status(403).json({ error: "Not authorized" });

    res.status(200).json(event.rsvp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- SEND NOTIFICATIONS ----------------
router.post("/:id/notify", verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("rsvp.alumniId", "name email");
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (req.userRole !== "admin" && event.organizedBy.toString() !== req.userId)
      return res.status(403).json({ error: "Not authorized" });

    const { message } = req.body;

    let locationText = "";
    if (event.mode === "online") locationText = `Join online at: ${event.meetingLink}`;
    else if (event.mode === "offline") locationText = `Location: ${event.location}`;
    else if (event.mode === "hybrid") locationText = `Location: ${event.location}\nOnline link: ${event.meetingLink}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    for (const participant of event.rsvp) {
      if (participant.status === "Registered") {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: participant.email,
          subject: `Update for Event: ${event.title}`,
          text: `Hi ${participant.name},\n\n${message}\n\nEvent Details:\nTitle: ${event.title}\n${locationText}\nDate: ${event.startDate}\n\nThank you!`
        });
      }
    }

    res.status(200).json({ message: "Notifications sent to all participants" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
