import express from "express";
import Student from "../models/student.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Get own profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.userId).select("-password");
    if (!student || student.status !== "approved")
      return res.status(403).json({ error: "Only approved students can access profile" });

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// Update own profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student || student.status !== "approved")
      return res.status(403).json({ error: "Only approved students can update profile" });

    Object.assign(student, req.body);
    await student.save();
    res.status(200).json({ message: "Profile updated successfully", student });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Search students
router.get("/search", verifyToken, async (req, res) => {
  try {
    const { name, email, course, yearOfStudy, rollNumber } = req.query;
    const query = { status: "approved", _id: { $ne: req.userId } };

    if (name) query.name = { $regex: name, $options: "i" };
    if (email) query.email = { $regex: email, $options: "i" };
    if (course) query.course = { $regex: course, $options: "i" };
    if (yearOfStudy) query.yearOfStudy = yearOfStudy;
    if (rollNumber) query.rollNumber = { $regex: rollNumber, $options: "i" };

    const result = await Student.find(query).select("-password");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error searching students", error: error.message });
  }
});

export default router;
