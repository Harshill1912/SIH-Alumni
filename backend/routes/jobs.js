import express from "express";
import Job from "../models/Job.js";
import Alumni from "../models/Alumni.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Create job (approved alumni only)
router.post("/", verifyToken, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId);
    if (!alumni || alumni.status !== "approved") return res.status(403).json({ error: "Only approved alumni can post jobs" });

    const job = new Job({ ...req.body, postedBy: req.userId });
    await job.save();
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

export default router;
