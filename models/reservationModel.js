import mongoose from "mongoose";

const reservationSchema = mongoose.Schema(
  {
    carRent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "carRent", 
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: false, 
    },
    vorname: {
      type: String,
      required: true,
    },
    nachname: {
      type: String,
      required: true,
    },
    geburtsdatum: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    telefonnummer: {
      type: String,
      required: true,
    },
    adresse: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    stadt: {
      type: String,
      required: true,
    },
    pickupDate: {
      type: String,
      required: true,
    },
    returnDate: {
      type: String,
      required: true,
    },
    pickupTime: {  
      type: String,
      required: true, 
    },
    returnTime: {  
      type: String,
      required: true, 
    },
    gesamtPrice: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
