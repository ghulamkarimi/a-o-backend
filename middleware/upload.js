import multer from 'multer';
import fs from 'fs';
import path from 'path';



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Route-Parameter prüfen (z.B. 'buy')
      const route = req.baseUrl.split('/').pop(); // Holt das letzte Segment des Routenpfads
      console.log('Route detected:', route); // Debugging
  
      let folder = '';
      if (route === 'buy') {
        folder = 'images/carBuyImages'; // Für /buy
      } else if (route === 'rent') {
        folder = 'images/carRentImages'; // Für /rent
      } else if (route === 'user') {
        folder = 'images/userImages'; // Für /user
      } else {
        folder = 'images/otherUploads'; // Fallback-Ordner
      }
  
      console.log('Selected folder:', folder);
  
      // Prüfen, ob der Ordner existiert, und falls nicht, erstellen
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
  
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileName = `${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, fileName);
    },
  });
  
  export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      cb(null, true); // Akzeptiere alle Dateien
    },
  });
  

// Middleware exportieren
export const uploadMiddleware = upload.fields([
  { name: "carImages", maxCount: 10 }, // Bis zu 10 Dateien für `carImages`
]);

