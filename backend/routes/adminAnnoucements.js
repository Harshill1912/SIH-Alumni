import express from "express";
import Announcement from "../models/AnnoucementSchema.js";
import {verifyToken,verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// Create announcement (admin only)
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    const announcement = new Announcement({ title, message, postedBy: req.adminId });
    await announcement.save();
    res.status(201).json({ message: "Announcement created successfully", announcement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete announcement (admin only)
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    await announcement.deleteOne();
    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
// Alumni sees all announcements (sorted newest first)
router.get("/", verifyToken, async (req, res) => {
  const announcements = await Announcement.find()
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
  res.status(200).json(announcements);  
})
