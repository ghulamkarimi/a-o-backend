import { Router } from "express";
import { createCarRent,getCarRents,deleteCarRent,getCarRentById, updateCarRent, getCarRentByUser} from "../controller/carRentController.js";
 

const carRentRouter = Router();

carRentRouter.post("/create", createCarRent);
carRentRouter.get("/getRents", getCarRents);
carRentRouter.get("/getRent/:id", getCarRentById);
carRentRouter.delete("/deleteRentCar", deleteCarRent);
carRentRouter.put("/updateRentCar", updateCarRent);
carRentRouter.get("/getRentByUser", getCarRentByUser);
carRentRouter.put

export default carRentRouter;
