import { createClient } from 'webdav';
import dotenv from 'dotenv';

dotenv.config();

// WebDAV-Client-Konfiguration
const initializeWebDAVClient = () => {
  return createClient(process.env.WEBDAV_URL, {
    username: process.env.WEBDAV_USERNAME,
    password: process.env.WEBDAV_PASSWORD,
  });
};

// Retry-Funktion
const retry = (fn, retries = 3) => {
  return fn().catch((err) => {
    if (retries > 0) {
      console.warn(`Retrying... (${3 - retries + 1})`);
      return retry(fn, retries - 1);
    }
    console.error('Retry failed after multiple attempts:', err.message);
    throw err;
  });
};

// Datei hochladen mit Retry
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

    // Retry-Mechanismus für das Hochladen
    await retry(() => {
      const client = initializeWebDAVClient(); // Stelle sicher, dass ein neuer Client initialisiert wird
      return client.putFileContents(filePath, file.buffer);
    });

    return `${process.env.WEBDAV_URL}${filePath}`;
  } catch (err) {
    console.error('Fehler beim Hochladen:', err.message, err.stack);
    throw err;
  }
};

// Datei abrufen mit Retry
export const getFileFromWebDAV = async (filePath) => {
  try {
    const fileContents = await retry(() => {
      const client = initializeWebDAVClient(); // Stelle sicher, dass ein neuer Client initialisiert wird
      return client.getFileContents(filePath);
    });
    return fileContents;
  } catch (err) {
    console.error('Fehler beim Abrufen der Datei:', err.message, err.stack);
    throw err;
  }
};

// Datei löschen mit Retry
export const deleteFileFromWebDAV = async (filePath) => {
  try {
    await retry(async () => {
      const client = initializeWebDAVClient(); // Stelle sicher, dass ein neuer Client initialisiert wird
      const exists = await client.exists(filePath);

      if (!exists) {
        console.warn(`Datei existiert nicht: ${filePath}`);
        return;
      }

      await client.deleteFile(filePath);
    });
    console.log(`Datei erfolgreich gelöscht: ${filePath}`);
  } catch (err) {
    console.error(`Fehler beim Löschen der Datei ${filePath}:`, err.message, err.stack);
    throw err;
  }
};
