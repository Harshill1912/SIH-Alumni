import express from "express";
import Alumni from "../models/Alumni.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const alumni = new Alumni(req.body);
    await alumni.save();
    res.status(201).json({ message: "Alumni registered successfully, pending admin approval" });
  } catch (error) {
    res.status(400).json({ message: "Error registering alumni", error: error.message });
  }
});

// Login - only approved alumni
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const alumni = await Alumni.findOne({ email });
    if (!alumni) return res.status(404).json({ message: "Alumni not found" });
    if (alumni.status !== "approved") return res.status(403).json({ message: "Your account is pending admin approval" });

    const isMatch = await bcrypt.compare(password, alumni.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: alumni._id, role: alumni.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

export default router;
