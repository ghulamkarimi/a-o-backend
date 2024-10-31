 import mongoose from "mongoose";

 const carRentSchema = mongoose.Schema({
    carName: {
      type: String,
      required: true,
    },
    carImage: {
      type: String,
      required: true,
    },
    carAC:{
      type: Boolean,
      required: true,
    },
    carGear:{
      type: String,
      required: true,
    },
    carPrice:{
      type: String,
      required: true,
    },
    carDoors:{
      type: String,
      required: true,
    },
    carPeople: {
      type: String,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    bookedSlots: [
      {
        start: {
          type: Date,
          required: true,
        },
        end: {
          type: Date,
          required: true,
        },
      },
    ],
     },
    { timestamps: true }
     );

    const carRent = mongoose.model("carRent", carRentSchema);
    export default carRent;






  
