
import asyncHandler from 'express-async-handler';
import CarBuy from '../models/carBuyModel.js';
import { checkAdmin } from '../middleware/validator/checkAdmin.js';
import fs from 'fs';
import path from 'path';

export const generateUniqueDigitRandomNumber = async() => {
   let isUnique = false;
    let carIdentificationNumber ;
    while (!isUnique) {
        carIdentificationNumber = Math.floor(100000 + Math.random() * 900000);
        const existingCar =await CarBuy.findOne({ carIdentificationNumber });
        if (!existingCar) {
            isUnique = true;
        }
    }
    return carIdentificationNumber;
};

export const createBuyCar = asyncHandler(async (req, res) => {
  try {
    const {
      carTitle,
      carPrice,
      carCategory,
      fuelType,
      owner,
      isSold = false,
      carDescription,
      carKilometers,
      carColor,
      carAirConditioning = false,
      carSeat,
      carEuroNorm,
      damagedCar = false,
      carNavigation = false,
      carParkAssist = false,
      carAccidentFree = false,
      carFirstRegistrationDay,
      carGearbox,
      carMotor,
      carHorsePower,
      carTechnicalInspection,
      userId,
    } = req.body;
    const carIdentificationNumber = await generateUniqueDigitRandomNumber();
    const user = await checkAdmin(userId); // Überprüfe Adminrechte
 // Base URL für Bildpfade
 const BASE_URL = process.env.BASE_URL || `https://${process.env.PORT || 7001}`;

 // Datei-URLs aus `req.files` extrahieren
 const imageUrls = req.files.carImages.map((file) =>
   `${BASE_URL}/${file.path.replace(/\\/g, '/')}` // Pfad mit Base URL
 );

    const carBuy = new CarBuy({
      carTitle,
      carCategory,
      carPrice,
      owner,
      carImages: imageUrls, // Speichere Bild-URLs in der Datenbank
      isSold,
      carFirstRegistrationDay,
      carDescription,
      carKilometers,
      carColor,
      carAirConditioning,
      carSeat,
      carIdentificationNumber,
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
    console.error('Fehler in createBuyCar:', error.message);
    res.status(400).json({ message: error.message });
  }
});

export const getCarBuys = asyncHandler(async (req, res) => {
  try {
    // Abruf aller Fahrzeugkäufe aus der Datenbank
    const carBuys = await CarBuy.find();

    // Sende die Fahrzeugkäufe als JSON-Antwort
    res.status(200).json(carBuys);
  } catch (error) {
    console.error('Fehler beim Abrufen der Fahrzeugkäufe:', error.message);
    res.status(500).json({ message: 'Fehler beim Abrufen der Fahrzeugkäufe' });
  }
});

export const deleteCarBuy = asyncHandler(async (req, res) => {
  const { userId, carId } = req.body;
  if (!userId || !carId) {
    return res.status(400).json({ message: 'User ID und Car ID sind erforderlich' });
  }
  try {
    const user = await checkAdmin(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Nicht autorisiert, Fahrzeug zu löschen' });
    }
    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }
    if (carBuy.carImages && carBuy.carImages.length > 0) {
      carBuy.carImages.forEach((imageUrl) => {
        const relativePath = imageUrl.replace(`${process.env.BASE_URL || `http://localhost:${process.env.PORT || 7001}`}/`, '');
        const fullPath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath); 
          console.log(`Gelöschte Datei: ${fullPath}`);
        } else {
          console.warn(`Datei nicht gefunden: ${fullPath}`);
        }
      });
    }
    await CarBuy.findByIdAndDelete(carId);
    res.status(200).json({ message: 'Fahrzeug und zugehörige Bilder erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Fahrzeugs:', error.message);
    res.status(500).json({ message: 'Fehler beim Löschen des Fahrzeugs' });
  }
});

export const updateCarBuy = asyncHandler(async (req, res) => {
  const { userId, carId, keepImages } = req.body;

  if (!userId || !carId) {
    return res.status(400).json({ message: "User ID und Car ID sind erforderlich" });
  }

  try {
    const user = await checkAdmin(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Nicht autorisiert, Fahrzeug zu aktualisieren" });
    }

    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      return res.status(404).json({ message: "Fahrzeug nicht gefunden" });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 7001}`;

    // Filter images to be retained
    const retainedImages = carBuy.carImages.filter((image) =>
      keepImages?.includes(image)
    );

    // Remove images that are not retained
    carBuy.carImages.forEach((imageUrl) => {
      if (!retainedImages.includes(imageUrl)) {
        const relativePath = imageUrl.replace(`${baseUrl}/`, "");
        const localPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
    });

    // Add new images
    const newImageUrls =
      req.files?.carImages?.map((file) => `${baseUrl}/${file.path.replace(/\\/g, "/")}`) || [];

    // Update the car data
    const updates = {
      ...req.body,
      carImages: [...retainedImages, ...newImageUrls],
    };
    Object.assign(carBuy, updates);

    const updatedCarBuy = await carBuy.save();
    res.status(200).json(updatedCarBuy);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Fahrzeugs:", error.message);
    res.status(500).json({ message: "Fehler beim Aktualisieren des Fahrzeugs" });
  }
});


