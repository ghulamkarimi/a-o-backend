import express from "express";
import { capturePayment, createOrder, createPayment } from '../controller/paymentController.js';

const paymentRouter = express.Router();


paymentRouter.post("/createOrder", createOrder);
paymentRouter.post("/createPayment", createPayment);
paymentRouter.get("/success", capturePayment);  
paymentRouter.get("/cancel", (req, res) => {
  res.send("Die Zahlung wurde abgebrochen."); 
});

export default paymentRouter;
