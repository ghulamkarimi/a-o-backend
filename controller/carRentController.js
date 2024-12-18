import asyncHandler from "express-async-handler";
import CarRent from "../models/carRentModel.js";
import { checkAdmin } from "../middleware/validator/checkAdmin.js";
import mongoose from "mongoose";

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
import fs from "fs";
import path from "path";

export const createCarRent = asyncHandler(async (req, res) => {
  const {
    carName,
    carPrice,
    carAC,
    carDoors,
    carPeople,
    carGear,
    isBooked,
    userId,
  } = req.body;

  try {
    // Prüfen, ob der Benutzer Admin-Rechte hat
    const user = await checkAdmin(userId);
    console.log("user:", user);

    // Prüfen, ob eine Datei hochgeladen wurde
    if (!req.file) {
      return res.status(400).json({ message: "Keine Datei hochgeladen" });
    }

    // Bild-URL erstellen
    const imageUrl = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
    console.log("imageUrl:", imageUrl);

    
    // Neues Auto erstellen oder vorhandenes aktualisieren
    const carRent = await CarRent.findOneAndUpdate(
      { carName }, // Filter: Aktualisieren nach carName (oder anderer ID)
      {
        carName,
        carAC,
        carPrice,
        carDoors,
        carPeople,
        carGear,
        isBooked,
        carImage: imageUrl, // Neues Bild speichern
        userId: user._id,
      },
      { new: true, upsert: true } // Neues erstellen, falls nicht vorhanden
    );

    // Erfolgsantwort senden
    res.status(201).json({
      message: "Auto erfolgreich erstellt/aktualisiert",
      carRent,
    });
  } catch (error) {
    console.error("Error in createCarRent:", error.message);
    res.status(500).json({ message: "Interner Serverfehler" });
  }
});

export const deleteCarRent = asyncHandler(async (req, res) => {
  const userId = req.body.userId;
  console.log(userId);
  const CarId = req.body.CarId;
  console.log(CarId);
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid User Id" });
    return;
  }
  if (!CarId || !mongoose.Types.ObjectId.isValid(CarId)) {
    res.status(400).json({ message: "Invalid Car Id" });
    return;
  }
  try {
    const user = await checkAdmin(userId);
    if (!user) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }
    const carRent = await CarRent.findByIdAndDelete(CarId);
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
  const { carName, carPrice, carAC, carDoors, carPeople, carGear, isBooked, userId, carId } = req.body;

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    return res.status(400).json({ message: "Ungültige Auto-ID" });
  }

  try {
    const user = await checkAdmin(userId);
    const carRent = await CarRent.findById(carId);

    if (!carRent) {
      return res.status(404).json({ message: "Auto nicht gefunden" });
    }

    // Bild aktualisieren, falls ein neues hochgeladen wird
    let imageUrl = carRent.carImage; // Altes Bild behalten
    if (req.file) {
      // Neues Bild speichern
      imageUrl = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;

      // Altes Bild löschen
      const oldImagePath = path.resolve(`.${carRent.carImage.split(req.get("host"))[1]}`);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Felder aktualisieren
    carRent.carName = carName || carRent.carName;
    carRent.carPrice = carPrice || carRent.carPrice;
    carRent.carImage = imageUrl;
    carRent.carAC = carAC !== undefined ? carAC : carRent.carAC;
    carRent.carDoors = carDoors || carRent.carDoors;
    carRent.carPeople = carPeople || carRent.carPeople;
    carRent.carGear = carGear || carRent.carGear;
    carRent.isBooked = isBooked !== undefined ? isBooked : carRent.isBooked;

    const updatedCarRent = await carRent.save();
    res.json({ message: "Auto erfolgreich aktualisiert", carRent: updatedCarRent });
  } catch (error) {
    console.error("Error in updateCarRent:", error.message);
    res.status(500).json({ message: "Interner Serverfehler" });
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
