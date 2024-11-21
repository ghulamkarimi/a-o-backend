import asyncHandler from "express-async-handler";
import CarBuy from "../models/carBuyModel.js";
import { checkAdmin } from "../middleware/validator/checkAdmin.js";
import mongoose from "mongoose";
import {deleteFileFromWebDAV} from "../middleware/webdav.js";


export const createBuyCar = asyncHandler(async (req, res) => {
  const {
    carTitle,
    carPrice,
    carCategory,
    fuelType,
    owner,
    isSold,
    carDescription,
    carKilometers,
    carColor,
    carAirConditioning,
    carSeat,
    carEuroNorm,
    damagedCar,
    carNavigation,
    carParkAssist,
    carAccidentFree,
    carFirstRegistrationDay,
    carGearbox,
    carMotor,
    carHorsePower,
    carTechnicalInspection,
    userId,
  } = req.body;

  let imageUrls = req.body.carImages || []
  try {
    const user = await checkAdmin(userId);  // Überprüfe, ob der Benutzer ein Admin ist

    const carBuy = new CarBuy({
      carTitle,
      carCategory,
      carPrice,
      owner,
      carImages: imageUrls, // Speichere die Bild-URLs in der Datenbank
      isSold,
      carFirstRegistrationDay,
      carDescription,
      carKilometers,
      carColor,
      carAirConditioning,
      carSeat,
      damagedCar,
      carNavigation,
      carParkAssist,
      carAccidentFree,
      carGearbox,
      carMotor,
      carEuroNorm,
      carHorsePower,
      fuelType,
      carTechnicalInspection,
      user: user._id,
    });

    const createdCarBuy = await carBuy.save();
    res.status(201).json(createdCarBuy);
  } catch (error) {
    console.error("Fehler in createBuyCar:", error.message);
    res.status(400).json({ message: error.message });
  }
});


export const getCarBuys = asyncHandler(async () => {
  console.log("Versuche, Fahrzeugkäufe abzurufen...");

  const carBuys = await CarBuy.find();

  console.log("Abgerufene Fahrzeugkäufe:", carBuys);

  if (!carBuys || carBuys.length === 0) {
    return { message: "Keine Fahrzeugkäufe gefunden" }; // Rückgabe einer Fehlermeldung
  }

  return carBuys; // Rückgabe der Fahrzeugkäufe
});

function extractFilePathFromUrl(url) {
  const urlObject = new URL(url);
  let filePath = decodeURIComponent(urlObject.pathname); // Dekodiere den Pfad statt zu kodieren
  if (filePath.startsWith("/")) {
    filePath = filePath.substring(1); // Entferne den führenden Slash, wenn nötig
  }
  return filePath;
}

export const deleteCarBuy = asyncHandler(async (req, res) => {
  const userId = req.body.userId;
  const carId = req.body.carId;

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

    if (!user.isAdmin) {
      res.status(403).json({ message: "Not authorized to delete car buy" });
      return;
    }

    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      res.status(404).json({ message: "Car Buy not found" });
      return;
    }

    if (carBuy.carImages && carBuy.carImages.length > 0) {
      for (const imageUrl of carBuy.carImages) {
        try {
          const filePath = extractFilePathFromUrl(imageUrl);
          await deleteFileFromWebDAV(filePath); // Verwende die Funktion zum Löschen der Datei von WebDAV
        } catch (error) {
          throw new Error("Fehler beim Löschen der Datei von WebDAV");
        }
      }
    }

    // Lösche den Fahrzeugkauf aus der Datenbank
    await carBuy.deleteOne({_id:carId}); // Entferne den Fahrzeugkauf aus der DB

    res.json({ message: "Car Buy sold and images deleted successfully" });
  } catch (error) {
    console.log("Fehler in deleteCarBuy:", error.message);
    res.status(500).json({ message: "Fehler beim Löschen des Car Buy" });
  }
});



export const updateCarBuy = asyncHandler(async (req, res) => {
  const {
    carTitle,
    carPrice,
    carImage,
    carCategory,
    fuelType,
    carEuroNorm,
    owner,
    isSold,
    carDescription,
    carKilometers,
    carColor,
    carAirConditioning,
    carSeat,
    damagedCar,
    carNavigation,
    carParkAssist,
    carAccidentFree,
    carFirstRegistrationDay,
    carGearbox,
    carMotor,
    carHorsePower,
    carTechnicalInspection,
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

  try {
    const user = await checkAdmin(userId);
    if (!user) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }

    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      res.status(404).json({ message: "Car Buy not found" });
      return;
    }

    carBuy.carTitle = carTitle;
    carBuy.carPrice = carPrice;
    carBuy.carImage = carImage;
    carBuy.carCategory = carCategory;
    carBuy.carDescription = carDescription;
    carBuy.carKilometers = carKilometers;
    carBuy.carColor = carColor;
    carBuy.carAirConditioning = carAirConditioning;
    carBuy.carSeat = carSeat;
    carEuroNorm = carEuroNorm;
    carBuy.damagedCar = damagedCar;
    carBuy.carNavigation = carNavigation;
    carBuy.carParkAssist = carParkAssist;
    carBuy.carAccidentFree = carAccidentFree;
    carBuy.carFirstRegistrationDay = carFirstRegistrationDay;
    carBuy.carGearbox = carGearbox;
    carBuy.carMotor = carMotor;
    carBuy.carHorsePower = carHorsePower;
    carBuy.fuelType = fuelType;
    carBuy.owner = owner;
    carBuy.isSold = isSold;
    carBuy.carTechnicalInspection = carTechnicalInspection;

    const updatedCarBuy = await carBuy.save();
    res.json(updatedCarBuy);
  } catch (error) {
    console.log("Error in updateCarBuy", error.message);
    res.status(400).json({ message: error.message });
  }
});
