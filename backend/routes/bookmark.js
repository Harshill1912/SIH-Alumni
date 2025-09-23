import express from "express";
import Alumni from "../models/Alumni.js";
import Job from "../models/Job.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify alumni
const verifyAlumni = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    if (decoded.role !== "alumni") return res.status(403).json({ error: "Access denied" });

    req.userId = decoded.id;
    next();
  });
};

// Bookmark a job
router.post("/:jobId", verifyAlumni, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId);
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (!alumni.bookmarkedJobs.includes(job._id)) {
      alumni.bookmarkedJobs.push(job._id);
      await alumni.save();
    }

    res.status(200).json({ message: "Job bookmarked successfully", bookmarkedJobs: alumni.bookmarkedJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookmarked jobs
router.get("/", verifyAlumni, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId).populate("bookmarkedJobs");
    res.status(200).json({ bookmarkedJobs: alumni.bookmarkedJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a bookmarked job
router.delete("/:jobId", verifyAlumni, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId);
    alumni.bookmarkedJobs = alumni.bookmarkedJobs.filter(
      jobId => jobId.toString() !== req.params.jobId
    );
    await alumni.save();
    res.status(200).json({ message: "Job removed from bookmarks", bookmarkedJobs: alumni.bookmarkedJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
