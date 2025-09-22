import express from "express";
import Alumni from "../models/Alumni.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// Protected routes: only admin can access
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

export default router;
