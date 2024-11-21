import { createClient } from 'webdav';
import dotenv from 'dotenv';

dotenv.config();

export const webdavClient = createClient(process.env.WEBDAV_URL, {
  username: process.env.WEBDAV_USERNAME,
  password: process.env.WEBDAV_PASSWORD,
});

webdavClient.getDirectoryContents('/')
  .then(contents => console.log("Inhalt des Wurzelverzeichnisses:", contents))
  .catch(err => console.error("WebDAV-Fehler:", err.message));


export const getFileFromWebDAV = async (req, res) => {
  const { filePath } = req.params; 

  try {
    const fileContents = await webdavClient.getFileContents(filePath);
    res.setHeader("Content-Type", "image/jpeg");
    res.send(fileContents);
  } catch (error) {
    console.error('Fehler beim Abrufen der Datei:', error.message);
    res.status(500).json({ message: 'Fehler beim Abrufen der Datei' });
  }
};

export const deleteFileFromWebDAV = async (filePath) => {
  try {
    console.log(`Überprüfe Datei-Existenz für Pfad: ${filePath}`);
    const exists = await webdavClient.exists(filePath);

    if (!exists) {
      console.warn(`Datei existiert nicht: ${filePath}`);
      return;
    }

    console.log(`Lösche Datei: ${filePath}`);
    await webdavClient.deleteFile(filePath);
    console.log(`Datei erfolgreich gelöscht: ${filePath}`);
  } catch (error) {
    console.error(`Fehler beim Löschen der Datei ${filePath}:`, error);
    throw error; // Weiterwerfen des Fehlers, um ihn in der Controller-Funktion zu behandeln
  }
};

