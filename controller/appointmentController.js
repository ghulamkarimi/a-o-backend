import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Appointment from "../models/appointmentModel.js";
dotenv.config();

export const createAppointment = asyncHandler(async (req, res) => {
  const { service, fullName, email, phone, date, licensePlate, notes } =
    req.body;

  // Termin in der Datenbank erstellen
  const appointment = await Appointment.create({
    service,
    fullName,
    email,
    phone,
    licensePlate,
    date,
    notes,
  });

  // E-Mail an den Admin senden
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASS_MAIL,
    },
  });


  const formattedDate = new Date(appointment.date).toLocaleString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
});


  const mailOptions = {
    from: appointment.email,
    to: process.env.EMAIL,
    subject: "Neue Terminbuchung",
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <h2 style="text-align: center; color: #333;">Neue Terminbuchung</h2>
        <p style="font-size: 16px; color: #555;">Sie haben eine neue Terminbuchung von <strong>${fullName}</strong> erhalten:</p>
        <ul style="font-size: 16px; color: #555; margin-left: 20px;">
          <li><strong>Service:</strong> ${service}</li>
          <li><strong>Termin:</strong> ${formattedDate}</li>
          <li><strong>Fahrzeugkennzeichen:</strong> ${licensePlate}</li>
          <li><strong>Telefon:</strong> ${phone}</li>
          <li><strong>Notizen:</strong> ${notes}</li>
        </ul>
        <p style="font-size: 16px; color: #555;">Um den Termin zu bestätigen, klicken Sie bitte auf den folgenden Button:</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="http://localhost:7001/appointment/${appointment._id}/confirm" 
             style="padding: 15px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: background-color 0.3s ease;">
            Termin Bestätigen
          </a>
        </div>
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 20px;">
          Wenn Sie diese E-Mail nicht erwartet haben, ignorieren Sie sie bitte.
        </p>
      </div>
    </div>
  `
  
  };

  await transporter.sendMail(mailOptions);

  res
    .status(201)
    .json({ message: "Termin erfolgreich erstellt und Admin benachrichtigt." });
});


export const confirmAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
   
        const appointment = await Appointment.findByIdAndUpdate(
            { _id: id },
            { status: "confirmed" },
            { new: true, runValidators: true } 
        );

        if (!appointment) {
            return res.status(404).json({ message: "Termin nicht gefunden." });
        }

        console.log("Updated Appointment:", appointment);

   
        const formattedDate = new Date(appointment.date).toLocaleString("de-DE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
        });

     
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS_MAIL,
            },
            debug: true, 
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: appointment.email,
            subject: "Terminbestätigung",
            html: `
                <p>Sehr geehrter Kunde,</p>
                <p>Ihr Termin für <strong>${appointment.service}</strong> am <strong>${formattedDate}</strong> wurde erfolgreich bestätigt.</p>
                <p>Vielen Dank für Ihre Buchung!</p>
                <p>Mit freundlichen Grüßen,<br />Ihr Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Termin bestätigt und Benutzer benachrichtigt." });

    } catch (error) {
        console.error("Fehler beim Bestätigen des Termins oder beim Senden der E-Mail:", error);
        if (error.response) {
            console.error("Error Response from nodemailer:", error.response);
        }
        res.status(500).json({ message: "Fehler beim Bestätigen des Termins oder Senden der E-Mail.", error: error.message });
    }
});

  export const showConfirmationPage = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
  
    const appointment = await Appointment.findById(id);
  
    if (!appointment) {
      return res.status(404).send("Termin nicht gefunden.");
    }
    const formattedDate = new Date(appointment.date).toLocaleString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",

    })
  
    
    return res.status(200).send(`
      <html>
        <head>
          <title>Termin Bestätigung</title>
        </head>
        <body>
          <h1>Ihr Termin wurde bestätigt!</h1>
          <p>Der Termin für den Service <strong>${appointment.service}</strong> am <strong>${formattedDate}</strong> wurde erfolgreich bestätigt.</p>
          <p>Wir freuen uns, Sie bald zu begrüßen!</p>
        </body>
      </html>
    `);
  });
  
