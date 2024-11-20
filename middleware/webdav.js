import { createClient } from 'webdav';
import dotenv from 'dotenv';

dotenv.config();

// WebDAV-Client-Konfiguration
const webdavClient = createClient(process.env.WEBDAV_URL, {
  username: process.env.WEBDAV_USERNAME,
  password: process.env.WEBDAV_PASSWORD,
});

// Funktion zum Abrufen der Datei von WebDAV
export const getFileFromWebDAV = async (req, res) => {
  const { filePath } = req.params; // Beispielsweise: /getImage/:filePath

  try {
    // Abrufe die Datei von WebDAV
    const fileContents = await webdavClient.getFileContents(filePath);

    // Setze den richtigen MIME-Typ, z.B. für Bilder
    res.setHeader("Content-Type", "image/jpeg"); // Dynamisch anpassen, falls notwendig

    // Sende die Datei als Antwort zurück
    res.send(fileContents);
  } catch (error) {
    console.error('Fehler beim Abrufen der Datei:', error.message);
    res.status(500).json({ message: 'Fehler beim Abrufen der Datei' });
  }
};
