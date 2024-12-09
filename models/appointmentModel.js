import mongoose from "mongoose";
 

const appointmentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  licensePlate: { type: String, required: false },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  isBookedOrBlocked: { type: Boolean, default: false },
  service: { type: String, required: false },
  comment: { type: String, required: false },
  hsn: { type: String, required: false },
  tsn: { type: String, required: false },
  userId : { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
});
appointmentSchema.index({ date: 1, time: 1 }, { unique: true });
const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;