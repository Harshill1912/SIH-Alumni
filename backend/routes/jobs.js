import express from "express";
import Job from "../models/Job.js";
import Alumni from "../models/Alumni.js";
import Notification from "../models/Notiflication.js"; // check spelling
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify JWT
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

// -Job Routes -

// Create job (approved alumni only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId);
    if (!alumni || alumni.status !== "approved") 
      return res.status(403).json({ error: "Only approved alumni can post jobs" });

    const job = new Job({ ...req.body, postedBy: req.userId });
    await job.save();

    // Notify all other approved alumni
    const approvedAlumni = await Alumni.find({ status: "approved", _id: { $ne: req.userId } });
    const notifications = approvedAlumni.map(a => ({
      alumniId: a._id,
      jobId: job._id,
      message: `New job posted: ${job.title} at ${job.company}`,
    }));
    await Notification.insertMany(notifications);

    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all jobs
router.get("/", async (req, res) => {
  const jobs = await Job.find().populate("postedBy", "name email company");
  res.json(jobs);
});

// Job search (put BEFORE comments routes)
router.get("/search", async (req, res) => {
  try {
    const { title, company, location, eligibility } = req.query;
    const query = {};
    if (title) query.title = { $regex: title, $options: "i" };
    if (company) query.company = { $regex: company, $options: "i" };
    if (location) query.location = { $regex: location, $options: "i" };
    if (eligibility) query.eligibility = { $regex: eligibility, $options: "i" };

    const jobs = await Job.find(query).populate("postedBy", "name email company");
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job (only by poster)
router.put("/:id", verifyToken, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.postedBy.toString() !== req.userId) return res.status(403).json({ error: "Not authorized" });

  Object.assign(job, req.body);
  await job.save();
  res.json(job);
});

// Delete job (only by poster)
router.delete("/:id", verifyToken, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.postedBy.toString() !== req.userId) return res.status(403).json({ error: "Not authorized" });

  await job.remove();
  res.json({ message: "Job deleted" });
});

// -------------------- Comments --------------------

// Add comment to a job
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const { text } = req.body;
    const comment = { userId: req.userId, text };
    job.comments.push(comment);
    await job.save();

    res.status(201).json({ message: "Comment added", comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a job
router.get("/:id/comments", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("comments.userId", "name email");
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.status(200).json(job.comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -Notifications-

// Get all notifications for logged-in alumni
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ alumniId: req.userId })
      .sort({ createdAt: -1 })
      .populate("jobId", "title company location applyLink");
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
});

// Mark notification as read
router.put("/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if (notification.alumniId.toString() !== req.userId)
      return res.status(403).json({ message: "Not authorized" });

    notification.read = true;
    await notification.save();
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
});

export default router;
