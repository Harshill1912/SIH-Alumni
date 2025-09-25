import express from "express";
import Student from "../models/student.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Register Student
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, course, yearOfStudy, rollNumber } = req.body;

    // Check if email or roll number already exists
    const existingStudent = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (existingStudent) {
      return res.status(400).json({ message: "Student with this email or roll number already exists" });
    }

    const student = new Student({ name, email, password, course, yearOfStudy, rollNumber });
    await student.save();

    res.status(201).json({ message: "Student registered successfully, pending approval" });
  } catch (error) {
    res.status(500).json({ message: "Error registering student", error: error.message });
  }
});

// Login Student
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student.status !== "approved") return res.status(403).json({ message: "Student not approved yet" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

export default router;
