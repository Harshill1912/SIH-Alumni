import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  course: { type: String, required: true },
  yearOfStudy: { type: Number, required: true },
  rollNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  role: { type: String, enum: ["student"], default: "student" },
  bookmarkedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  attendedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }]
}, { timestamps: true });

studentSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default mongoose.model("Student", studentSchema);
