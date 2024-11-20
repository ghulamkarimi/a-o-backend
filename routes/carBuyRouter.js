import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { uploadFileToWebDAV } from "../middleware/uploadMiddleware.js";
import { getFileFromWebDAV } from '../middleware/webdav.js';
import {
  createBuyCar,
  getCarBuys,
  deleteCarBuy,
  updateCarBuy,
} from "../controller/carBuyController.js";

const carBuyRouter = express.Router();

// Route zum Erstellen eines Fahrzeugkaufs und Hochladen von Bildern
carBuyRouter.post(
  "/create",
  upload.array("carImages", 10),
  async (req, res) => {
    try {
      if (req.files && req.files.length > 0) {
        console.log("Received files:", req.files);

        // WebDAV Upload direkt in der Route
        const imageUrls = await Promise.all(
          req.files.map((file) => uploadFileToWebDAV(file, "carBuy"))
        );

        req.body.carImages = imageUrls; // Speichere die Bild-URLs in req.body

        console.log("Bild-URLs:", req.body.carImages);
      }

      // Übergabe an den Controller für die Erstellung des Fahrzeugkaufs
      await createBuyCar(req, res);
    } catch (error) {
      console.error("Fehler beim Hochladen der Bilder:", error.message);
      res.status(500).json({
        message: "Fehler beim Hochladen der Bilder.",
        error: error.message,
      });
    }
  }
);

// Route zum Abrufen einer Datei von WebDAV
carBuyRouter.get("/getImage/:filePath", getFileFromWebDAV);

carBuyRouter.get("/allBuys", async (req, res) => {
  try {
    const carBuys = await getCarBuys(); // Diese Funktion ruft die Fahrzeugkäufe aus der DB ab

    if (carBuys.message) {
      return res.status(404).json({ message: carBuys.message });
    }

    // Sende die Fahrzeugkäufe als Antwort
    res.status(200).json(carBuys);
  } catch (error) {
    console.error("Fehler beim Abrufen der Fahrzeugkäufe:", error.stack); // Zeigt den vollständigen Fehlerstack
    res.status(500).json({ message: "Fehler beim Abrufen der Fahrzeugkäufe", error: error.message });
  }
});



carBuyRouter.delete("/delete", deleteCarBuy);
carBuyRouter.put("/update", updateCarBuy);

export default carBuyRouter;
