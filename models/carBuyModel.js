import mongoose from "mongoose";

const carBuySchema = new mongoose.Schema({
  carTitle: {
    type: String,
    required: true,
  },
  carCategory: {
    type: String,
    required: true,
    enum: ["Transporter", "PKW", "Wohnwagen"],
  },
  carPrice: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  isSold: {
    type: Boolean,
    default: false,
  },
  carFirstRegistrationDay: {
    type: Date,
    required: true,
  },
  carImage: {
    type: [String],
    required: true,
  },
  carDescription: {
    type: String,
    required: true,
  },
  carKilometers: {
    type: String,
    required: true,
  },
  carColor: {
    type: String,
    required: true,
  },
  carAirConditioning: {
    type: Boolean,
    required: true,
  },
  carSeat: {
    type: String,
    required: true,
  },
  damagedCar: {
    type: Boolean,
    required: true,
  },
  carNavigation: {
    type: Boolean,
    required: true,
  },
  carParkAssist: {
    type: Boolean,
    required: true,
  },
  carAccidentFree: {
    type: Boolean,
    required: true,
  },
  carGearbox: {
    type: String,
    required: true,
  },
  carMotor: {
    type: String,
    required: true,
  },
  carHorsePower: {
    type: String,
    required: true,
  },
  fuelType: {
    type: String,
    required: true,
  },
  carTechnicalInspection: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

const CarBuy = mongoose.model("CarBuy", carBuySchema);
export default CarBuy;