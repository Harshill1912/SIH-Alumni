import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "Alumni", required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
