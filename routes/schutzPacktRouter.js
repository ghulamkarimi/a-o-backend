import express from "express";
import {
  createSchutzPacket,
  deleteSchutzPacket,
  getAllSchutzPacket,
  updateSchutzPacket,
} from "../controller/schutzpaketController.js";

const schutzPacketRouter = express.Router();

schutzPacketRouter.post("/createSchutzPacket", createSchutzPacket);
schutzPacketRouter.delete("/deleteSchutzPacket", deleteSchutzPacket);
schutzPacketRouter.get("/getAllSchutzPacket", getAllSchutzPacket);
schutzPacketRouter.put("/updateSchutzPacket", updateSchutzPacket);

export default schutzPacketRouter;
