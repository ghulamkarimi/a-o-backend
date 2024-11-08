
import express from "express";
import { createAppointment, confirmAppointment,showConfirmationPage } from "../controller/appointmentController.js";


const router = express.Router();


router.post("/", createAppointment);
router.get("/:id/confirm", showConfirmationPage);
router.patch("/:id/confirm", confirmAppointment);

export default router;
