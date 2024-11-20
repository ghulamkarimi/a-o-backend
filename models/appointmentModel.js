import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    service: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
  },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
