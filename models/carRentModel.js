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




carRentSchema.virtual("clearBookedSlotsAfterReturn").get(function () {
  if (this.isBooked) {
    const returnDate = new Date(this.returnDate);
    const currentDate = new Date();
    
    if (currentDate >= returnDate) {
      this.bookedSlots = []; // Leere gebuchte Slots bei Rückgabe
      this.isBooked = false; // Setze das Fahrzeug auf nicht gebucht
    }
  }
  return this.bookedSlots;
});


carRentSchema.methods.extendBooking = function (newStart, newEnd) {
 
  const newStartDate = new Date(newStart);
  const newEndDate = new Date(newEnd);

  if (newStartDate >= newEndDate) {
    throw new Error("Ungültige Daten. Der Startzeitpunkt kann nicht nach dem Endzeitpunkt liegen.");
  }


  for (let slot of this.bookedSlots) {
    if ((newStartDate >= slot.start && newStartDate <= slot.end) ||
        (newEndDate >= slot.start && newEndDate <= slot.end)) {
      throw new Error("Die neuen Zeiträume überschneiden sich mit bereits gebuchten Slots.");
    }
  }

  this.bookedSlots.push({ start: newStartDate, end: newEndDate });
  return this.save();
};

const carRent = mongoose.model("carRent", carRentSchema);
export default carRent;