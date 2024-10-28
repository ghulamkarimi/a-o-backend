import mongoose from "mongoose";

const carBuySchema = new mongoose.Schema({
  carTitle: {
    type: String,
    required: true,
  },
  carCategory: {
    type: String,
    required: true,
  },
  carPrice: {
    type: String,
    required: true,
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
    validate: [arrayLimit],
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
  carTechnicalInspection: {
    type: Date,
    required: true,
  },
  carDescription: {
    type: String,
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
}
},
{ timestamps: true }
);

function arrayLimit(val) {
  return val.length <= 16;
}

const CarBuy = mongoose.model("CarBuy", carBuySchema);
export default CarBuy;
