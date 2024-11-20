import express from "express";
import {upload}  from "../middleware/uploadMiddleware.js";
import {uploadFileToWebDAV} from "../middleware/uploadMiddleware.js";
import multer from "multer";

import {
  createBuyCar,
  getCarBuys,
  deleteCarBuy,
  updateCarBuy,
} from "../controller/carBuyController.js";

const carBuyRouter = express.Router();
carBuyRouter.post(
  "/create",
  (req, res, next) => {
    upload.array("carImages", 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "Upload-Fehler: " + err.message });
      } else if (err) {
        return res.status(500).json({ message: "Serverfehler: " + err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const imageUrls = await Promise.all(
          req.files.map((file) => uploadFileToWebDAV(file, 'carBuy')) // Typ korrekt übergeben
        );
        req.body.carImages = imageUrls;
      }

      // Übergabe an die Haupt-Controller-Funktion
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



carBuyRouter.get("/allBuys", getCarBuys);
carBuyRouter.delete("/delete", deleteCarBuy);
carBuyRouter.put("/update", updateCarBuy);

export default carBuyRouter;
