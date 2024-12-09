import Appointment from "../models/appointmentModel.js";
import asyncHandler from "express-async-handler";
import { appointmentConfirmationEmail,sendSimpleCancellationEmail } from "../email/mailSender.js";
import dotenv from "dotenv";
import { Socket } from "socket.io";


dotenv.config();

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
      userId,
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
        userId:userId || null,
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
      appointment.user = userId || null,
      appointment.isBookedOrBlocked = true;
    }

    await appointment.save();

    try {
      // Sende die Bestätigungs-E-Mail
      await appointmentConfirmationEmail(
        email,
        firstName,
        lastName,
        date,
        time,
        service,
        licensePlate,
        hsn,
        tsn,
        appointment._id.toString()
      );
    } catch (error) {
      console.error("Fehler beim Senden der Terminbestätigungs-E-Mail:", error);
    }

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).send("Fehler beim Buchen des Termins");
  }
};

export const cancelAppointment = asyncHandler(async (req, res) => {
  try {
    // Termin-ID aus den URL-Parametern erhalten
    const { appointmentId } = req.params;

    // Termin in der Datenbank suchen
    const appointment = await Appointment.findById(appointmentId);

    // Prüfen, ob der Termin existiert und noch gebucht ist
    if (!appointment || !appointment.isBookedOrBlocked) {
      return res.status(400).json({
        success: false,
        message: "Termin nicht gefunden oder bereits freigegeben.",
      });
    }
    if (appointment.email) {
      try {
        await sendCancellationEmail(
          appointment.email,
          appointment.firstName,
          appointment.lastName,
          appointment.date,
          appointment.time
        );
      } catch (error) {
        console.error("Fehler beim Senden der Stornierungs-E-Mail:", error);
      }
    }
    // Termin löschen
    await Appointment.findByIdAndDelete(appointmentId);

    // Erfolgsantwort mit einer schön gestalteten HTML-Seite senden
    const successPage = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Termin Stornierung Erfolgreich</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background-color: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #28a745;
            padding: 15px;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            color: #fff;
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px;
          }
          .content p {
            font-size: 18px;
            line-height: 1.6;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Stornierung Erfolgreich</h1>
          </div>
          <div class="content">
            <p>Ihr Termin wurde erfolgreich storniert.</p>
            <p>Wir hoffen, Sie bald wieder bei der A und O Werkstatt begrüßen zu dürfen.</p>
          </div>
          <div>
           <a href="http://localhost:3000" style="text-decoration: none; background-color: #007bff; color: #fff; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">Zurück zur Startseite</a>

          </div>
          <div class="footer">
            &copy; 2024 A und O Werkstatt. Alle Rechte vorbehalten.
          </div>
        </div>
      </body>
      </html>
    `;

    res.status(200).send(successPage);
  } catch (err) {
    // Fehlerbehandlung und Fehlermeldung zurücksenden
    res.status(500).json({
      success: false,
      message: "Fehler beim Stornieren des Termins",
      error: err.message,
    });
  }
});

export const getAllAppointments = asyncHandler(async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Abrufen der Termine" });
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
    req.io.emit("appointmentBlocked", appointment);

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


    if (!appointment || !appointment.isBookedOrBlocked) {
      return res.status(400).send("Termin nicht gefunden oder bereits freigegeben");
    }

    const appointmentDate = new Date(appointment.date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).send("Ungültiges Datumsformat");
    }
    if (appointment.email) {
      try {
        await sendSimpleCancellationEmail(
          appointment.email,
          appointment.firstName,
          appointmentDate,
          appointment.time
        );
      } catch (error) {
        console.error("Fehler beim Senden der Stornierungs-E-Mail:", error);
      }
      await Appointment.findByIdAndDelete(appointmentId);
      req.io.emit("appointmentUnblocked", appointmentId);
      return res.send("Gebuchter Termin erfolgreich storniert und gelöscht");
    }
    await Appointment.findByIdAndDelete(appointmentId);
    res.send("Blockierter Termin erfolgreich freigegeben");
  } catch (err) {
    console.error("Fehler beim Freigeben des Termins:", err);
    res.status(500).send("Fehler beim Freigeben des Termins");
  }
});



 
