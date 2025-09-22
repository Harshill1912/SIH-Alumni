import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const alumniSchema =new mongoose.Schema({
    name:{type : String,require:true},
    email:{type : String,require:true,unique:true},
    password:{type : String,require:true},
    graduationYear:{type : Number,require:true},
    course:{type : String,require:true},
    company:String,
    designation:String,
     location:String,
     linkedInProfile:String,
     status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  role: { type: String, enum: ["alumni", "admin"], default: "alumni" }

});

alumniSchema.pre("save",async function (next) {
    if(!this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
  next();
    }
})

export default mongoose.model("Alumni",alumniSchema);