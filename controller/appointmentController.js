import Appointment from "../models/appointmentModel.js";
import asyncHandler from "express-async-handler";
import { appointmentConfirmationEmail } from "../email/mailSender.js";

export const createAppointment = async (req, res) => {
  try {
    const {
      date,
      time,
      firstName,
      lastName,
      licensePlate,
      email,
      phone,
      service,
      comment,
      hsn,
      tsn,
    } = req.body;
    let appointment = await Appointment.findOne({ date, time });

    if (appointment && appointment.isBookedOrBlocked) {
      return res.status(400).send("Termin ist bereits gebucht oder blockiert.");
    }

    if (!appointment) {
      // Wenn kein Termin vorhanden ist, erstelle einen neuen
      appointment = new Appointment({
        date,
        time,
        firstName,
        lastName,
        licensePlate,
        email,
        phone,
        service,
        comment,
        hsn,
        tsn,
        isBookedOrBlocked: true,
      });
    } else {
      // Falls der Termin vorhanden und verfügbar ist, aktualisiere ihn
      appointment.firstName = firstName;
      appointment.lastName = lastName;
      appointment.licensePlate = licensePlate;
      appointment.email = email;
      appointment.phone = phone;
      appointment.service = service;
      appointment.comment = comment;
      appointment.hsn = hsn;
      appointment.tsn = tsn;
      appointment.isBookedOrBlocked = true;
    }

    await appointment.save();
    try {
        await appointmentConfirmationEmail(
          email,
          firstName,
          lastName,
          date,
          time,
          service,
          licensePlate,
          hsn,
          tsn
        );
      } catch (error) {
        console.error("Fehler beim Senden der Terminbestätigungs-E-Mail:", error);
      }
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).send("Fehler beim Buchen des Termins");
  }
};

export const getAllAppointments = asyncHandler(async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Abrufen der Termine" });
  }
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || !appointment.isBookedOrBlocked)
      return res
        .status(400)
        .send("Termin nicht gefunden oder bereits freigegeben");

    await Appointment.findByIdAndDelete(appointmentId);
    res.status(200).send("Termin erfolgreich gelöscht");
  } catch (err) {
    res.status(500).send("Fehler beim Stornieren des Termins");
  }
});

export const blockAppointment = asyncHandler(async (req, res) => {
  try {
    const { date, time } = req.body;

    // Convert date to Date object to ensure consistency
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Ungültiges Datumsformat" });
    }

    let appointment = await Appointment.findOne({ date: parsedDate, time });
    if (!appointment) {
      appointment = new Appointment({
        date: parsedDate,
        time,
        isBookedOrBlocked: true,
      });
    } else if (appointment.isBookedOrBlocked) {
      return res
        .status(400)
        .json({ message: "Termin ist bereits gebucht oder blockiert" });
    } else {
      appointment.isBookedOrBlocked = true;
    }
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error("Fehler beim Blockieren des Termins:", err);
    res.status(500).json({ message: "Fehler beim Blockieren des Termins" });
  }
});

export const unblockAppointment = asyncHandler(async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || !appointment.isBookedOrBlocked)
      return res
        .status(400)
        .send("Termin nicht gefunden oder bereits freigegeben");

    await Appointment.findByIdAndDelete(appointmentId);
    res.send("Termin erfolgreich freigegeben");
  } catch (err) {
    res.status(500).send("Fehler beim Freigeben des Termins");
  }
});
