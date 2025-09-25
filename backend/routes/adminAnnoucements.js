import express from "express";
import Announcement from "../models/AnnoucementSchema.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router=express.Router();

router.post("/",verifyAdmin,async(req,res)=>{
    try {
        const {title,message}=req.body;
        const annoucemnent = new Announcement({title,message,postedBy:req.adminId});
        await annoucemnent.save();
        res.status(201).json({message:"Announcement created successfully"},annoucemnent);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})

router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: "Not found" });
    await announcement.deleteOne();
    res.status(200).json({ message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;