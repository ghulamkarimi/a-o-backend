import express from "express";
import { capturePayment, createOrder } from '../controller/paymentController.js';

const paymentRouter = express.Router();


paymentRouter.post("/createOrder", createOrder);

paymentRouter.get("/capture", capturePayment);  
paymentRouter.get("/cancel", (req, res) => {
  res.send("Die Zahlung wurde abgebrochen."); 
});

export default paymentRouter;
