import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({ 
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'Alumni',required:true},
  text:{type:String,required:true},
  createdAt:{type:Date,default:Date.now}
});
const jobSchema=new mongoose.Schema({
    title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  description: String,
  eligibility: String,           
  applyLink: String,           
  postedBy: {                 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Alumni",
    required: true
  },
  comments:[commentSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Job",jobSchema);