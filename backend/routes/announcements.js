import express from "express";
import Announcement from "../models/Announcement.js";
import { verifyToken } from "../middleware/verifyToken.js"; // alumni or admin

const router = express.Router();

// Alumni sees all announcements (sorted newest first)
router.get("/", verifyToken, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
