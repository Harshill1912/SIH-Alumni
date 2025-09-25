import express from "express";
import Announcement from "../models/AnnoucementSchema.js"
import { verifyToken } from "../middleware/verifyAdmin.js"; // alumni or admin

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
