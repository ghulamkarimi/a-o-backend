import express from 'express';
import {cancelAppointment, createAppointment,blockAppointment , unblockAppointment,getAllAppointments} from "../controller/appointmentController.js"

const appointmentRouter = express.Router();

// User routes

appointmentRouter.post('/create',createAppointment);
appointmentRouter.get("/cancel/:appointmentId", cancelAppointment)


// Admin routes
appointmentRouter.post("/block", blockAppointment)
appointmentRouter.delete("/unblock",unblockAppointment )

appointmentRouter.get("/all", getAllAppointments)

export default appointmentRouter;