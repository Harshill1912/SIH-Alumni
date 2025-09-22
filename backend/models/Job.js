import mongoose from "mongoose";

const jobSchema=new mongoose.Schema({
    title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  description: String,
  eligibility: String,           
  applyLink: String,             // email or external link
  postedBy: {                    // reference to alumni who posted
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Alumni",
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Job",jobSchema);