import express from "express";
import { uploadMiddleware } from "../middleware/upload.js";
import {
  createBuyCar,
  getCarBuys,
  deleteCarBuy,
  updateCarBuy,
} from "../controller/carBuyController.js";

// Middleware zur Typ-Setzung

const carBuyRouter = express.Router();

carBuyRouter.post("/create", uploadMiddleware, createBuyCar);
carBuyRouter.get("/get", getCarBuys);
carBuyRouter.delete("/delete", deleteCarBuy);
carBuyRouter.put("/update", updateCarBuy);

export default carBuyRouter;
