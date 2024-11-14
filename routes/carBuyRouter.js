import express from 'express';
import { createBuyCar, getCarBuys, deleteCarBuy, updateCarBuy } from '../controller/carBuyController.js';



const carBuyRouter = express.Router();

carBuyRouter.post('/create',createBuyCar);
  
carBuyRouter.get('/allBuys', getCarBuys);
carBuyRouter.delete('/delete', deleteCarBuy);
carBuyRouter.put('/update', updateCarBuy);

export default carBuyRouter;
