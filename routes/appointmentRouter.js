
import express from "express";
import { createAppointment, confirmAppointment,showConfirmationPage } from "../controller/appointmentController.js";
import { appointmentValidator } from "../middleware/validator/appointmentValidator.js";


const appointmentRouter = express.Router();


appointmentRouter.post("/",appointmentValidator,createAppointment);
appointmentRouter.get("/:id/confirm", confirmAppointment);
appointmentRouter.get("/:id/confirm", showConfirmationPage);

export default appointmentRouter;
