import express from "express";
import {
  createOffer,
  editOffer,
  deleteOffer,
  getOffers,
} from "../controller/offerController.js";
import { upload } from "../middleware/upload.js";

const offerRouter = express.Router();

offerRouter.post("/createOffer", upload.single("offerImage"), createOffer);
offerRouter.get("/getOffers", getOffers);
offerRouter.put("/editOffer", upload.single("offerImage"), editOffer);
offerRouter.delete("/deleteOffer", deleteOffer);

export default offerRouter;
