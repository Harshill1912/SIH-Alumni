import express from "express";
import Alumni from "../models/Alumni.js"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();


router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, masterPassword } = req.body;

    // Verify the master key
    if (masterPasswordnow !== process.env.MASTER_ADMIN_PASSWORD) {
      return res.status(403).json({ message: "Invalid master key" });
    }

    // Check if an admin already exists
    const existingAdmin = await Alumni.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin account already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = new Alumni({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      status: "approved"
    });

    await admin.save();
    res.status(201).json({ message: "Admin account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin", error: error.message });
  }
});

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password, masterPassword } = req.body;

    // Find admin by email and role
    const admin = await Alumni.findOne({ email, role: "admin" });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Check master password from env
    if (masterPassword !== process.env.MASTER_ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid master password" });
    }

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Admin login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

export default router;
