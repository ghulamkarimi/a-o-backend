import { createClient } from 'webdav'; // Importiere 'createClient' direkt
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

// WebDAV-Client-Konfiguration
const webdavClient = createClient(process.env.WEBDAV_URL, {
  username: process.env.WEBDAV_USERNAME,
  webdav_url: process.env.WEBDAV_URL,
  password: process.env.WEBDAV_PASSWORD,
});

// Multer-Memory Storage für Dateien
const storage = multer.memoryStorage();

// Multer-Konfiguration
export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif|webp|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);  // ruf den Callback mit null (kein Fehler) und true (Akzeptieren der Datei) auf
    } else {
      cb(new Error('Nur Bilddateien sind erlaubt!'));  // Callback mit Fehler aufrufen
    }
  },
});

// Funktion zum Hochladen einer Datei mit WebDAV
export const uploadFileToWebDAV = async (file, type) => {
  try {
    if (!file || !file.originalname || !file.buffer) {
      throw new Error('Ungültige Datei oder Buffer nicht vorhanden');
    }

    const folderName = {
      carBuy: 'carBuyImages',
      carRent: 'carRentImages',
      user: 'userImages',
    }[type];

    if (!folderName) {
      throw new Error('Unbekannter Typ für das Hochladen');
    }

    const fileExtension = path.extname(file.originalname) || '.jpg';
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const filePath = `/${folderName}/${fileName}`;

    // Datei in WebDAV hochladen
    await webdavClient.putFileContents(filePath, file.buffer);

    // Rückgabe der URL des hochgeladenen Bildes
    return `https://u434074.your-storagebox.de${filePath}`;
  } catch (err) {
    console.error('Fehler beim Hochladen:', err.message, err.stack);
    throw err;
  }
};

