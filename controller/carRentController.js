import asyncHandler from "express-async-handler";
import CarRent from "../models/carRentModel.js";
import { checkAdmin } from "../middleware/validator/checkAdmin.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

export const getCarRents = asyncHandler(async (req, res) => {
  const carRents = await CarRent.find();
  res.json(carRents);
});

export const getCarRentById = asyncHandler(async (req, res) => {
  const carRent = await CarRent.findById(req.params.id);
  if (carRent) {
    res.json(carRent);
  } else {
    res.status(404).json({ message: "Car Rent not found" });
  }
});

export const createCarRent = asyncHandler(async (req, res) => {
  try {
    const {
      carName,
      carPrice,
      carAC,
      carDoors,
      carPeople,
      carGear,
      isBooked,
      userId,
      bookedSlots,
    } = req.body;

    const BASE_URL = process.env.BASE_URL || `${process.env.BASE_URL}`;
    const imageUrl = `${BASE_URL}/${req.file.path.replace(/\\/g, "/")}`;
    console.log(req.file);

    if (!imageUrl) {
      throw new Error("Autobild ist erforderlich.");
    }

    // Admin-Prüfung
    const user = await checkAdmin(userId);
    if (!user) {
      throw new Error("Benutzer nicht gefunden oder keine Admin-Rechte.");
    }

    // Miettage berechnen
    const rentalDays =
      bookedSlots?.reduce((totalDays, slot) => {
        const startDate = new Date(slot.start);
        const endDate = new Date(slot.end);
        const diffInTime = endDate.getTime() - startDate.getTime();
        const diffInDays = diffInTime / (1000 * 3600 * 24);
        return totalDays + diffInDays;
      }, 0) || 1;

    const totalPrice = rentalDays * parseFloat(carPrice);

    const carRent = new CarRent({
      carName,
      carAC,
      carPrice,
      carDoors,
      carPeople,
      carGear,
      isBooked,
      carImage: imageUrl,
      user: user._id,
      bookedSlots: bookedSlots || [],
      totalPrice,
    });

    const createdCarRent = await carRent.save();
    res.status(201).json({
      message: "Fahrzeug erfolgreich erstellt.",
      car: createdCarRent,
    });
  } catch (error) {
    console.error("Error in createCarRent:", error.message);
    res.status(400).json({
      message: error.message || "Fehler beim Erstellen des Fahrzeugs.",
    });
  }
});

export const deleteCarRent = asyncHandler(async (req, res) => {
  const userId = req.body.userId;
  console.log(userId);
  const carId = req.body.carId;
  console.log(carId);
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid User Id" });
    return;
  }
  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    res.status(400).json({ message: "Invalid Car Id" });
    return;
  }
  try {
    const user = await checkAdmin(userId);
    if (!user) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }
    const carRent = await CarRent.findByIdAndDelete(carId);
    if (!carRent) {
      res.status(404).json({ message: "Car Rent not found" });
      return;
    }
    res.json({ message: "Car Rent deleted successfully" });
  } catch (error) {
    console.log("Error in deleteCarRent", error.message);
    res.status(400).json({ message: "Error deleting car rent" });
  }
});

export const updateCarRent = asyncHandler(async (req, res) => {
  const {
    carName,
    carPrice,
    carImage,
    carAC,
    carDoors,
    carPeople,
    carGear,
    isBooked,
    userId,
    carId,
  } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid User Id" });
    return;
  }
  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    res.status(400).json({ message: "Invalid Car Id" });
    return;
  }
  console.log("userId:", userId);
  console.log("carId:", carId);

  try {
    const user = await checkAdmin(userId);
    if (!user) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }
    const carRent = await CarRent.findById(carId);
    if (!carRent) {
      res.status(404).json({ message: "Car Rent not found" });
      return;
    }
    carRent.carName = carName || carRent.carName;
    carRent.carPrice = carPrice || carRent.carPrice;
    carRent.carAC = carAC !== undefined ? carAC : carRent.carAC;
    carRent.carDoors = carDoors || carRent.carDoors;
    carRent.carPeople = carPeople || carRent.carPeople;
    carRent.carGear = carGear || carRent.carGear;
    carRent.isBooked = isBooked !== undefined ? isBooked : carRent.isBooked;

    if (req.file) {
      const BASE_URL = process.env.BASE_URL || `${process.env.BASE_URL}`;
      const newImageUrl = `${BASE_URL}/${req.file.path.replace(/\\/g, "/")}`;

      // Delete old image
      if (carRent.carImage) {
        const oldImagePath = path.join(
          process.cwd(),
          carRent.carImage.replace(BASE_URL, "")
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`Deleted old image: ${oldImagePath}`);
        }
        
      }

      carRent.carImage = newImageUrl;
    } else {
      carRent.carImage = req.body.carImage || carRent.carImage;
    }
    const updatedCarRent = await carRent.save();

    res.json(updatedCarRent);
  } catch (error) {
    console.log("Error in updateCarRent", error.message);
    res.status(400).json({ message: "Error updating car rent" });
  }
});

export const getCarRentByUser = asyncHandler(async (req, res) => {
  const userId = req.body.userId;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid User Id" });
    return;
  }
  try {
    const carRent = await CarRent.find({ user: userId });
    res.json(carRent);
  } catch (error) {
    console.log("Error in getCarRentByUser", error.message);
    res.status(400).json({ message: "Error getting car rent" });
  }
});

export const bookCar = asyncHandler(async (req, res) => {
  const { userId, carId, startDate, endDate } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid User Id" });
  }

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ message: "Invalid Car Id" });
  }

  try {
    const user = await checkAdmin(userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid User" });
    }

    const carRent = await CarRent.findById(carId);
    if (!carRent) {
      return res.status(404).json({ message: "Car Rent not found" });
    }

    if (carRent.isBooked) {
      return res.status(400).json({ message: "Car is already booked" });
    }

    carRent.startDate = startDate || carRent.startDate;
    carRent.endDate = endDate || carRent.endDate;
    carRent.isBooked = true;
    carRent.user = userId;

    const updatedCarRent = await carRent.save();
    return res.json(updatedCarRent);
  } catch (error) {
    console.log("Error in bookCar", error.message);
    return res.status(400).json({ message: "Error booking car" });
  }
});
