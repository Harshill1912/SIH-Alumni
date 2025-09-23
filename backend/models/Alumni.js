import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const alumniSchema =new mongoose.Schema({
    name:{type : String,required:true},
    email:{type : String,required:true,unique:true},
    password:{type : String,required:true},
    graduationYear:{type : Number,required:true},
    course:{type : String,required:true},
    company:String,
    designation:String,
     location:String,
     linkedInProfile:String,
     bookmarkedJobs:[{type:mongoose.Schema.Types.ObjectId,ref:"Job"}],  
     status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  role: { type: String, enum: ["alumni", "admin"], default: "alumni" }

},{timestamps:true});

alumniSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});


export default mongoose.model("Alumni",alumniSchema);