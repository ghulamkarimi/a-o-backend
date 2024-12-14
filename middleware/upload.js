import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Route-Parameter prüfen (z.B. 'buy')
      const route = req.baseUrl.split('/').pop(); // Holt das letzte Segment des Routenpfads
      console.log('Route detected:', route); // Debugging

      // Map für Ordnerstruktur basierend auf der Route
      const folderMap = {
        buy: 'images/carBuyImages',
        rent: 'images/carRentImages',
        user: 'images/userImages',
        offer: 'images/offerImages',
      };

      // Ordner basierend auf Route ermitteln
      const folder = folderMap[route] || 'images/otherUploads'; // Fallback-Ordner
      console.log('Selected folder:', folder);

      // Prüfen, ob der Ordner existiert, und falls nicht, erstellen
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`Folder created: ${folder}`);
      }

      cb(null, folder);
    } catch (error) {
      console.error('Error in determining destination folder:', error.message);
      cb(error, null); // Gibt den Fehler an Multer weiter
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileName = `${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, fileName);
    } catch (error) {
      console.error('Error in generating filename:', error.message);
      cb(error, null); // Gibt den Fehler an Multer weiter
    }
  },
});

// Multer-Instanz erstellen
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(new Error('Keine Datei hochgeladen'), false);
    }
    cb(null, true); // Akzeptiere alle Dateien
  },
});

export const uploadMiddleware = (req, res, next) => {
  const route = req.baseUrl.split('/').pop(); // Bestimme die Route
  console.log(`Detected Route: ${route}`); // Debugging

  // Dynamische Konfiguration basierend auf der Route
  let multerInstance;

  if (route === 'buy') {
    multerInstance = multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // Max. 10 MB pro Datei
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
        cb(null, true);
      },
    }).fields([{ name: 'carImages', maxCount: 10 }]); // Bis zu 10 Bilder
  } else if (route === 'rent') {
    multerInstance = multer({
      storage,
      limits: { fileSize: 3 * 1024 * 1024 }, // Max. 5 MB pro Datei
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
        cb(null, true);
      },
    }).single('carImage'); // Nur ein Bild
  } else if (route === 'user') {
    multerInstance = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // Max. 5 MB pro Datei
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
        cb(null, true);
      },
    }).single('userImage'); // Nur ein Bild
  } else if (route === 'offer') {
    multerInstance = multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // Max. 10 MB pro Datei
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
        cb(null, true);
      },
    }).single('offerImages'); // Bis zu 1 Bilder
  } else {
    return res.status(400).json({ message: 'Ungültige Route für Dateiupload' });
  }

  // Middleware ausführen
  multerInstance(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error(`Multer Fehler: ${err.message}`);
      return res.status(400).json({ message: `Multer Fehler: ${err.message}` });
    }
    if (err) {
      console.error(`Upload Fehler: ${err.message}`);
      return res.status(500).json({ message: `Upload Fehler: ${err.message}` });
    }
    next();
  });
};

  
  // Fehler-Handler für Multer
  export const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer Fehler: ${err.message}` });
    }
    if (err) {
      return res.status(500).json({ message: `Fehler: ${err.message}` });
    }
    next();
  };
  
