import express from "express";
import Job from "../models/Job.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify admin
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    if (decoded.role !== "admin") return res.status(403).json({ error: "Access denied" });

    req.adminId = decoded.id;
    next();
  });
};

// GET all jobs
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const jobs = await Job.find().populate("postedBy", "name email company");
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a job
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    await job.remove();
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
