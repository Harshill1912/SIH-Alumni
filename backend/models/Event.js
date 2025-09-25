import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  mode: { type: String, enum: ["online", "offline", "hybrid"], default: "offline" },
  location: String,
  meetingLink: String,

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Alumni", required: true },

  participants: [
    {
      alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "Alumni" },
      email: String,
      name: String,
      status: { type: String, enum: ["registered", "attended", "canceled"], default: "registered" },
      registeredAt: { type: Date, default: Date.now }
    }
  ],

  attendeesCount: { type: Number, default: 0 },
  maxCapacity: { type: Number, default: 100 },
  status: { type: String, enum: ["upcoming", "ongoing", "completed"], default: "upcoming" },
  cancellationReason: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Event", eventSchema);
