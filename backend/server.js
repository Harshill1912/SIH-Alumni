import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import adminAuthRoutes from './routes/adminAuth.js';
import jobRoutes from './routes/jobs.js';
import alumniProfile from './routes/alumniProfile.js'
import adminJobRoutes from './routes/adminJob.js';
import bookmarkRoutes from './routes/bookmark.js';
import eventRoutes from './routes/event.js';
import AdminAnnouncementRoutes from './routes/adminAnnoucements.js';
import AnnouncementRoutes from './routes/announcements.js';
import studentAuthRoutes from './routes/studentAuth.js';
import studentProfile from './routes/studentProfile.js';
dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Test route
app.get('/', (req, res) => res.send("Backend is running"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/alumni", alumniProfile);
app.use("/api/admin/jobs", adminJobRoutes);
app.use("/api/alumni/bookmarks", bookmarkRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin/announcements", AdminAnnouncementRoutes);
app.use("/api/announcements", AnnouncementRoutes);
app.use("/api/student/auth", studentAuthRoutes);
app.use("/api/student", studentProfile);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
