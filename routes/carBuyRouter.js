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

// In der 'carBuyRouter' - Route
carBuyRouter.post("/create", upload.array("carImages", 10), async (req, res) => {
  try {
    if (req.files && req.files.length > 0) {
      console.log('Received files:', req.files);

      // WebDAV Upload direkt in der Route
      const imageUrls = await Promise.all(
        req.files.map((file) => uploadFileToWebDAV(file, 'carBuy'))
      );

      req.body.carImages = imageUrls;  // Speichere die Bild-URLs in req.body

      console.log('Bild-URLs:', req.body.carImages);
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
});



carBuyRouter.get("/allBuys", getCarBuys);
carBuyRouter.delete("/delete", deleteCarBuy);
carBuyRouter.put("/update", updateCarBuy);

export default carBuyRouter;
