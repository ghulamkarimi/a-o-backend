import express from "express";  
import { createPayment } from '../controller/paymentController.js';


const paymentRouter = express.Router();

paymentRouter.post("/createPayment", createPayment);

export default paymentRouter;