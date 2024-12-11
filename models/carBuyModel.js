import mongoose from "mongoose";

const carBuySchema = new mongoose.Schema(
  {
    carTitle: {
      type: String,
      required: true,
    },
    carCategory: {
      type: String,
      required: true,
      enum: ["Transporter", "PKW", "Wohnwagen", "LKW", "Motorrad", "Wohnmobil", "Oldtimer", "Sonstiges"],
    },
    carPrice: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    carIdentificationNumber: {
      type: String,
    },
    isSold: {
      type: Boolean,
      default: false,
    },
    carEuroNorm: {
      type: String,
      required: true,
    },
    carFirstRegistrationDay: {
      type: Date,
      required: true,
    },
    carImages: {
      // Für mehrere Bilder
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
      degault: false,
    },
    carSeat: {
      type: String,
      required: true,
    },
    damagedCar: {
      type: Boolean,
      required: false,
      default: false,
    },
    carNavigation: {
      type: Boolean,
      required: false,
    },
    carParkAssist: {
      type: Boolean,
      required: false,
    },
    carAccidentFree: {
      type: Boolean,
      required: false,
      default: true,
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
  },
  { timestamps: true }
);

const CarBuy = mongoose.model("CarBuy", carBuySchema);
export default CarBuy;
