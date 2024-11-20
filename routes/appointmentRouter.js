
import express from "express";
import { createAppointment, confirmAppointment,showConfirmationPage,getAllAppointments,deleteAppointment } from "../controller/appointmentController.js";
import { appointmentValidator } from "../middleware/validator/appointmentValidator.js";


const appointmentRouter = express.Router();


appointmentRouter.post("/",appointmentValidator,createAppointment);
appointmentRouter.get("/getAll", getAllAppointments);
appointmentRouter.get("/:id/confirm", confirmAppointment);
appointmentRouter.get("/:id/confirm", showConfirmationPage);
appointmentRouter.delete("/delete", deleteAppointment);

export default appointmentRouter;
