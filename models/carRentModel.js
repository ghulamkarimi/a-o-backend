import mongoose from "mongoose";

const carRentSchema = mongoose.Schema(
  {
    carName: {
      type: String,
      required: true,
    },
    carImage: {
      type: String,
      required: true,
    },
    carAC: {
      type: Boolean,
      required: true,
    },
    carGear: {
      type: String,
      required: true,
    },
    carPrice: {
      type: String,
      required: true,
    },
    totalPrice: { 
      type: Number,  
      required: false,
    },
    carDoors: {
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bookedSlots: [
      {
        start: {
          type: Date,
        },
        end: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

carRentSchema.path("bookedSlots").validate(function (value) {
  if (this.isBooked) {
    return value && value.length > 0;
  } else {
    return true;
  }
});

const carRent = mongoose.model("carRent", carRentSchema);
export default carRent;
