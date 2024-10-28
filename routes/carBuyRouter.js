import express from 'express';
import { createBuyCar,getCarBuys, getCarBuysById,deleteCarBuy,updateCarBuy } from '../controller/carBuyController.js';

const carBuyRouter = express.Router();

carBuyRouter.post('/create', createBuyCar);
carBuyRouter.get("/allBuys", getCarBuys);
carBuyRouter.get("/carBuy/:id" , getCarBuysById)
carBuyRouter.delete("/delete", deleteCarBuy);
carBuyRouter.put("/update" , updateCarBuy);

export default carBuyRouter;