import express from 'express';
import { uploadMiddleware ,  handleUploadErrors,} from '../middleware/upload.js';
import { createBuyCar, getCarBuys, deleteCarBuy, updateCarBuy } from '../controller/carBuyController.js';

const carBuyRouter = express.Router();

carBuyRouter.post('/create', uploadMiddleware,handleUploadErrors,createBuyCar);
carBuyRouter.get('/allBuys', getCarBuys);
carBuyRouter.delete('/delete', deleteCarBuy);
carBuyRouter.put('/update', uploadMiddleware, (req, res, next) => {
  console.log('Received Files:', req.files); // Zeige hochgeladene Dateien
  console.log('Received Body:', req.body); // Zeige empfangene Form-Daten
  next();
}, updateCarBuy);
// `uploadMiddleware` für Updates hinzufügen

export default carBuyRouter;
