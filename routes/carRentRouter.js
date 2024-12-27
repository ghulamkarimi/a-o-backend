import { Router } from "express";
import { createCarRent,getCarRents,deleteCarRent,getCarRentById, updateCarRent, getCarRentByUser} from "../controller/carRentController.js";
import {upload} from '../middleware/upload.js';

const carRentRouter = Router();

carRentRouter.post("/create",upload.single("carImage"),createCarRent);
carRentRouter.get("/getRents", getCarRents);
carRentRouter.get("/getRent/:id", getCarRentById);
carRentRouter.delete("/deleteRentCar", deleteCarRent);
carRentRouter.put("/updateRentCar",upload.single("carImage"), updateCarRent);
carRentRouter.get("/getRentByUser", getCarRentByUser);


export default carRentRouter;
