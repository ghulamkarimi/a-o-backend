import mongoose from "mongoose";

const appointmentSlotSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // Datum und Zeit des Slots
  status: {
    type: String,
    enum: ["available", "booked", "blocked", "confirmed"], // Status des Slots
    default: "available",
  },
  service: String, // Der gewünschte Service (z.B. Ölwechsel)
  customerDetails: {
    fullName: String,
    email: String,
    phone: String,
    licensePlate: String,
    notes: String,
  },
  createdAt: { type: Date, default: Date.now }, // Slot-Erstellung
});

const AppointmentSlot = mongoose.model("AppointmentSlot", appointmentSlotSchema);

export default AppointmentSlot;
