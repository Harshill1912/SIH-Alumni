import mongoose from "mongoose";

const eventSchema=new mongoose.Schema({
 title:{type:String,required:true},
 description:String,
 location:String,
 startDate:{type:Date,required:true},
 endDate:{type:Date,required:true},
 organizedBy:{type:mongoose.Schema.Types.ObjectId,ref:"Alumni",required:true},
 rsvp:[
    {
        alumniId:{type:mongoose.Schema.Types.ObjectId,ref:'Alumni'},
        email:String,
        name:String,
        status:{type:String,enum:["Registered" ,"Atteneded","Cancelled"],default:"Maybe"},
        registeredAt:{type:Date,default:Date.now}       
    }
 ],
 atendeesCount:{type:Number,default:0},
 maxCapacity:{type:Number,default:100},
 status:{type:String,enum:["upcoming","ongoing","completed"],default:"upcoming"},
 cancellationReason:String,
 createdAt:{type:Date,default:Date.now}
})