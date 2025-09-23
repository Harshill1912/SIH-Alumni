import express from 'express';
import Alumni from '../models/Alumni.js';
import jwt from 'jsonwebtoken';

const router=express.Router();

const verifyToken=(req,res,next)=>{
  const authHeader=req.headers["authorization"];
  if(!authHeader) return res.status(401).json({error:"No token provided"});

  const token=authHeader.split(" ")[1]; 
  if(!token) return res.status(401).json({error:"Invalid token format"});   

  jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
    if(err) return res.status(401).json({error:"Invalid token"});
    req.userId=decoded.id;
    req.userRole=decoded.role;
    next();
  });

};

//get own profile (approved alumni only)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.userId).select("-password"); // exclude password
    if (!alumni || alumni.status !== "approved") {
      return res.status(403).json({ error: "Only approved alumni can access profile" });
    }
    res.status(200).json(alumni);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// Get own profile (approved alumni only)
router.put('/profile',verifyToken,async(req,res)=>{
    try {
        const alumni=await Alumni.findById(req.userId);;
        if(!alumni || alumni.status!=="approved") return res.status(403).json({error:"Only approved alumni can access profile"});
        const updates=req.body;
        Object.assign(alumni,updates);
        await alumni.save();
        return res.status(200).json({message:"Profile updated Successfully",alumni});
    } catch (error) {
        return res.status(500).json({message:"Error updating profile",error:error.message});    
    }
})

export default router;