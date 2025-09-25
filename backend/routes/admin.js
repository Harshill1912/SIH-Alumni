import express from "express";
import Alumni from "../models/Alumni.js";
import Student from "../models/student.js";
import Job from "../models/Job.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// Alumni approval/rejection
router.get("/pending", verifyAdmin, async (req, res) => {
  try {
    const pending = await Alumni.find({ status: "pending" });
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending alumni", error: error.message });
  }
});

router.put("/approve/:id", verifyAdmin, async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    res.status(200).json(alumni);
  } catch (error) {
    res.status(500).json({ message: "Error approving alumni", error: error.message });
  }
});

router.put("/reject/:id", verifyAdmin, async (req, res) => {
  try {
    const alumni = await Alumni.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    res.status(200).json(alumni);
  } catch (error) {
    res.status(500).json({ message: "Error rejecting alumni", error: error.message });
  }
});

// Student approval/rejection
router.get("/students/pending", verifyAdmin, async (req, res) => {
  try {
    const pendingStudents = await Student.find({ status: "pending" });
    res.status(200).json(pendingStudents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending students", error: error.message });
  }
});

router.put("/students/approve/:id", verifyAdmin, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Error approving student", error: error.message });
  }
});

router.put("/students/reject/:id", verifyAdmin, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Error rejecting student", error: error.message });
  }
});

// Admin Dashboard
router.get("/dashboard", verifyAdmin, async (req, res) => {
  try {
    const approvedAlumni = await Alumni.countDocuments({ status: "approved" });
    const pendingAlumni = await Alumni.countDocuments({ status: "pending" });
    const approvedStudents = await Student.countDocuments({ status: "approved" });
    const pendingStudents = await Student.countDocuments({ status: "pending" });
    const totalJobsPosted = await Job.countDocuments();

    const recentApprovals = await Alumni.find({ status: "approved" })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name email course graduationYear company designation");

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title company location eligibility");

    const alumniByCourse = await Alumni.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$course", count: { $sum: 1 } } }
    ]);

    const topCompanies = await Job.aggregate([
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      approvedAlumni,
      pendingAlumni,
      approvedStudents,
      pendingStudents,
      totalJobsPosted,
      recentApprovals,
      recentJobs,
      alumniByCourse,
      topCompanies
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
  }
});

export default router;
