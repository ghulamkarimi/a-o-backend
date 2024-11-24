
import asyncHandler from 'express-async-handler';
import CarBuy from '../models/carBuyModel.js';
import { checkAdmin } from '../middleware/validator/checkAdmin.js';
import fs from 'fs';
import path from 'path';

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

  try {
    const user = await checkAdmin(userId); // Überprüfe Adminrechte
 // Base URL für Bildpfade
 const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 7001}`;

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

  // Überprüfen, ob `userId` und `carId` gültig sind
  if (!userId || !carId) {
    return res.status(400).json({ message: 'User ID und Car ID sind erforderlich' });
  }

  try {
    // Überprüfen, ob der Benutzer Admin ist
    const user = await checkAdmin(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Nicht autorisiert, Fahrzeug zu löschen' });
    }

    // Fahrzeug abrufen
    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }

    // Bilderpfade löschen
    if (carBuy.carImages && carBuy.carImages.length > 0) {
      carBuy.carImages.forEach((imageUrl) => {
        // Entferne die Base URL und erhalte den relativen Pfad
        const relativePath = imageUrl.replace(`${process.env.BASE_URL || `http://localhost:${process.env.PORT || 7001}`}/`, '');
        const fullPath = path.join(process.cwd(), relativePath); // Absoluter Pfad

        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath); // Datei löschen
          console.log(`Gelöschte Datei: ${fullPath}`);
        } else {
          console.warn(`Datei nicht gefunden: ${fullPath}`);
        }
      });
    }

    // Fahrzeug aus der Datenbank löschen
    await CarBuy.findByIdAndDelete(carId);

    res.status(200).json({ message: 'Fahrzeug und zugehörige Bilder erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Fahrzeugs:', error.message);
    res.status(500).json({ message: 'Fehler beim Löschen des Fahrzeugs' });
  }
});
export const updateCarBuy = asyncHandler(async (req, res) => {
  const { userId, carId } = req.body;

  if (!userId || !carId) {
    return res.status(400).json({ message: 'User ID und Car ID sind erforderlich' });
  }

  try {
    const user = await checkAdmin(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Nicht autorisiert, Fahrzeug zu aktualisieren' });
    }

    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }

    // **Base URL definieren**
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 7001}`;

    // **Alte Bilder löschen**
    carBuy.carImages.forEach((imageUrl) => {
      const relativePath = imageUrl.replace(`${baseUrl}/`, ''); // Relativen Pfad extrahieren
      const localPath = path.join(process.cwd(), relativePath); // Absoluten Pfad erstellen
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`Gelöschte Datei: ${localPath}`);
      } else {
        console.warn(`Datei nicht gefunden: ${localPath}`);
      }
    });

    // **Neue Bilder hinzufügen**
    const newImageUrls = req.files?.carImages?.map((file) =>
      `${baseUrl}/${file.path.replace(/\\/g, '/')}`
    ) || [];

    // **Fahrzeugdaten aktualisieren**
    const updates = { ...req.body, carImages: newImageUrls.length > 0 ? newImageUrls : carBuy.carImages };
    Object.assign(carBuy, updates);

    const updatedCarBuy = await carBuy.save();
    res.status(200).json(updatedCarBuy);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Fahrzeugs:', error.message);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Fahrzeugs' });
  }
});


