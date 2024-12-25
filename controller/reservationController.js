import asyncHandler from "express-async-handler";
import CarRent from "../models/carRentModel.js";
import User from "../models/userModel.js";
import Reservation from "../models/reservationModel.js";
import nodeMailer from "nodemailer";
import dotenv from "dotenv";
import { checkAdmin } from "../middleware/validator/checkAdmin.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';





dotenv.config();

// Nodemailer-Transporter-Konfiguration
const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS_MAIL,
  },
});

// Funktion zum Erstellen einer Reservierung
export const createReservation = asyncHandler(async (req, res) => {
  const {
    vorname,
    nachname,
    geburtsdatum,
    email,
    telefonnummer,
    adresse,
    postalCode,
    stadt,
    pickupDate,
    returnDate,
    gesamtPrice,
    pickupTime,
    returnTime,
    carRentId,
    userId,
  } = req.body;

  try {
    // Überprüfe, ob das Fahrzeug existiert
    const carRent = await CarRent.findById(carRentId);
    if (!carRent) {
      return res.status(400).json({ message: "Fahrzeug nicht gefunden." });
    }

    // Wenn der Benutzer angegeben ist, suche nach dem Benutzer
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({ message: "Benutzer nicht gefunden." });
      }
    }

    // Erstelle die neue Reservierung
    const newReservation = new Reservation({
      carRent: CarRent ? carRent._id : new mongoose.Types.ObjectId(),
      user: user ? user._id : new mongoose.Types.ObjectId(),
      vorname,
      nachname,
      geburtsdatum,
      email,
      telefonnummer,
      adresse,
      postalCode,
      stadt,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      gesamtPrice,
      paymentStatus: "pending",
    });

    newReservation.reservierungStatus = "completed";
    await newReservation.save();

    const pickupDateTime = new Date(newReservation.pickupDate);
    const returnDateTime = new Date(newReservation.returnDate);

    // Gebuchte Slots aktualisieren
    carRent.bookedSlots = carRent.bookedSlots || [];
    carRent.bookedSlots.push({
      start: pickupDateTime,
      end: returnDateTime,
    });

    carRent.isReserviert = true;
    await carRent.save();
    console.log("newReservation._id", newReservation._id);
    const populatedReservation = await Reservation.findById(newReservation._id)
      .populate("carRent") // Lädt die Daten des Fahrzeugs
      .populate("user");

    // E-Mail an den Kunden senden
    const customerMailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reservierung wurde erfolgreich erstellt",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h1 style="text-align: center; color: #4CAF50;">Herzlichen Glückwunsch! Ihre Reservierung wurde erfolgreich erstellt.</h1>
          <p>Hallo ${vorname} ${nachname},</p>
          <p>Vielen Dank, dass Sie sich für unser Fahrzeug entschieden haben. Hier sind die Details Ihrer Reservierung:</p>
          <ul>
            <li><strong>Fahrzeug:</strong> ${carRent.carName}</li>
            <li><strong>Abholdatum:</strong> ${pickupDate} um ${pickupTime}</li>
            <li><strong>Rückgabedatum:</strong> ${returnDate} um ${returnTime}</li>
            <li><strong>Gesamtpreis:</strong> ${gesamtPrice} €</li>
          </ul>
          <p>Sie haben 24 Stunden nach der Reservierung Zeit, um diese gegebenenfalls abzulehnen, falls Sie Ihre Pläne ändern sollten.</p>
          <p>Klicken Sie auf den folgenden Link, um die Reservierung abzulehnen:</p>
          <a href="http://localhost:7001/reservation/reject-reservation/${newReservation._id}" style="background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Reservierung ablehnen</a>
          <p>Vielen Dank für Ihre Buchung! Wir freuen uns darauf, Ihnen ein tolles Fahrerlebnis zu bieten.</p>
          <p>Mit freundlichen Grüßen,<br>Das [A und O ] Team</p>
        </div>
      `,
    };

    // E-Mails senden
    await transporter.sendMail(customerMailOptions);

    res.status(201).json({
      message: "Reservierung erfolgreich erstellt und E-Mails versendet.",
      reservation: populatedReservation,
    });
  } catch (error) {
    console.error("Fehler bei der Reservierung:", error);
    res
      .status(500)
      .json({ message: "Fehler bei der Erstellung der Reservierung." });
  }
});

// Endpunkt zum Ablehnen der Reservierung
export const rejectReservation = asyncHandler(async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).send(`
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h1 style="text-align: center; color: #d9534f;">Reservierung kann nicht storniert werden</h1>
          <p>Die Reservierung kann nur innerhalb von 24 Stunden nach der Buchung storniert werden.</p>
        </div>
      `);
    }

    const bookingDateTime = new Date(reservation.createdAt); // Zeit der Buchung
    const currentDateTime = new Date();
    const timeDiff = currentDateTime - bookingDateTime; // Zeitdifferenz in Millisekunden

    // Überprüfen, ob weniger als 24 Stunden seit der Buchung vergangen sind
    if (timeDiff > 24 * 60 * 60 * 1000) {
      // 24 Stunden in Millisekunden
      return res.status(400).json({
        message:
          "Die Reservierung kann nur innerhalb von 24 Stunden nach der Buchung storniert werden.",
      });
    }

    // Reservierung stornieren
    reservation.isReserviert = false;
    reservation.reservierungStatus = "cancelled";
    await reservation.save();

    // Fahrzeug-Slots freigeben
    const carRent = await CarRent.findById(reservation.carRent);
    carRent.bookedSlots = carRent.bookedSlots.filter((slot) => {
      return !(
        slot.start <= new Date(reservation.pickupDate) &&
        slot.end >= new Date(reservation.pickupDate)
      );
    });

    carRent.isReserviert = false;
    await carRent.save();

    // E-Mails senden
    const customerMailOptions = {
      from: process.env.EMAIL,
      to: reservation.email,
      subject: "Reservierung storniert",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="text-align: center; color: #d9534f;">Reservierungsstornierung</h1>
          <p>Sehr geehrte/r ${reservation.vorname} ${reservation.nachname},</p>
          <p>Leider müssen wir Ihnen mitteilen, dass Ihre Reservierung für das Fahrzeug "${reservation.carRent.carName}" am ${reservation.pickupDate} um ${reservation.pickupTime} storniert wurde.</p>
          <p>Da Sie die Reservierung innerhalb von 24 Stunden nach der Buchung abgelehnt haben, konnten wir diese fortsetzen.</p>
          <p>Für weitere Informationen wenden Sie sich bitte an unseren Kundenservice.</p>
          <h2>Details der Reservierung:</h2>
          <ul>
            <li><strong>Fahrzeug:</strong> ${reservation.carRent.carName}</li>
            <li><strong>Abholdatum:</strong> ${reservation.pickupDate} um ${reservation.pickupTime}</li>
            <li><strong>Rückgabedatum:</strong> ${reservation.returnDate} um ${reservation.returnTime}</li>
            <li><strong>Gesamtpreis:</strong> ${reservation.gesamtPrice} €</li>
          </ul>
          <p>Vielen Dank für Ihr Verständnis.</p>
          <p>Mit freundlichen Grüßen,<br>Das [A und O AutoDoc] Team</p>
        </div>
      `,
    };

    const adminMailOptions = {
      from: process.env.EMAIL,
      to: "khalil.haouas@gmail.com",
      subject: "Reservierung abgelehnt",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="text-align: center; color: #d9534f;">Reservierungsstornierung</h1>
          <p>Hallo Admin,</p>
          <p>Eine Reservierung wurde storniert:</p>
          <ul>
            <li><strong>Kunde:</strong> ${reservation.vorname} ${reservation.nachname}</li>
            <li><strong>E-Mail:</strong> ${reservation.email}</li>
            <li><strong>Fahrzeug:</strong> ${reservation.carRent.carName}</li>
            <li><strong>Abholdatum:</strong> ${reservation.pickupDate} um ${reservation.pickupTime}</li>
            <li><strong>Rückgabedatum:</strong> ${reservation.returnDate} um ${reservation.returnTime}</li>
            <li><strong>Gesamtpreis:</strong> ${reservation.gesamtPrice} €</li>
          </ul>
          <p>Der Kunde hat die Reservierung storniert, weil sie innerhalb von 24 Stunden nach der Buchung abgelehnt wurde.</p>
          <p>Für weitere Informationen wenden Sie sich bitte an den Kundenservice.</p>
          <p>Mit freundlichen Grüßen,<br>Das [A und O] Team</p>
        </div>
      `,
    };

    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    // Reservierung löschen
    await Reservation.findByIdAndDelete(reservationId);

    res.status(200).send(`
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h1 style="text-align: center; color: #4CAF50;">Reservierung erfolgreich storniert</h1>
          <p>Die Reservierung wurde storniert, und eine E-Mail wurde an den Kunden gesendet.</p>
          <a href="/reservation" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Zurück zu den Reservierungen</a>
        </div>
      `);
  } catch (error) {
    console.error("Fehler bei der Ablehnung:", error);
    res.status(500);
    send(`
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h1 style="text-align: center; color: #d9534f;">Fehler</h1>
          <p>Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.</p>
        </div>
      `);
  }
});

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const { reservationId } = req.params;
  console.log("reservationId", reservationId);
  const { paymentStatus, isBooked } = req.body;
  console.log("paymentStatus", paymentStatus);

  try {
    // Reservierung finden
    const reservation = await Reservation.findById(reservationId);
    console.log("reservation", reservation);
    if (!reservation) {
      return res.status(404).json({ message: "Reservierung nicht gefunden." });
    }

    // Felder aktualisieren
    if (paymentStatus) reservation.paymentStatus = paymentStatus;
    if (typeof isBooked === "boolean") reservation.isBooked = isBooked;

    const updatedReservation = await reservation.save();

    res.status(200).json({
      message: "Reservierung erfolgreich aktualisiert.",
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Reservierung:", error);
    res
      .status(500)
      .json({ message: "Fehler beim Aktualisieren der Reservierung." });
  }
});

export const getAllReservation = asyncHandler(async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("user")
      .populate("carRent");
    res.status(200).json({ reservation: reservations || [] });
  } catch (error) {
    throw new Error("reservation not found");
  }
});

export const rejectReservationByAdmin = asyncHandler(async (req, res) => {
  const { reservationId, email, userId } = req.body;
  try {
    await checkAdmin(userId);

    const reservation = await Reservation.findById(reservationId).populate(
      "carRent"
    );
    if (!reservation || !reservation.carRent) {
      return res.status(404).json({
        message: "Reservierung nicht gefunden oder bereits storniert.",
      });
    }

    reservation.isReserviert = false;
    reservation.reservierungStatus = "cancelled";
    await reservation.save();

    const carRent = await CarRent.findById(reservation.carRent);
    if (!carRent) {
      return res.status(404).json({ message: "Fahrzeug nicht gefunden." });
    }
    carRent.bookedSlots = carRent.bookedSlots.filter((slot) => {
      return !(
        new Date(slot.start).getTime() <=
          new Date(reservation.pickupDate).getTime() &&
        new Date(slot.end).getTime() >=
          new Date(reservation.returnDate).getTime()
      );
    });

    carRent.isReserviert = false;
    await carRent.save();

    const formattedPickupDate = new Date(
      reservation.pickupDate
    ).toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedPickupTime = reservation.pickupTime
      ? new Date(
          `1970-01-01T${reservation.pickupTime.replace(" Uhr", "")}`
        ).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "00:00 Uhr";

    const formattedReturnDate = new Date(
      reservation.returnDate
    ).toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedReturnTime = reservation.returnTime
      ? new Date(
          `1970-01-01T${reservation.returnTime.replace(" Uhr", "")}`
        ).toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "00:00 Uhr";


    
      
      // Erforderliche Variablen
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // Bildpfad und Name ermitteln
      const carImageUrl = reservation.carRent.carImage;
      const carImageName = carImageUrl.split('/').pop();
      const imagePath = path.join(__dirname, `../images/carRentImages/${carImageName}`);
      
      // Bild in Base64 konvertieren
      let base64Image = '';
      
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        base64Image = imageBuffer.toString('base64');
      } else {
        console.error("Bild nicht gefunden:", imagePath);
        return res.status(404).json({
          message: "Fahrzeugbild nicht gefunden.",
        });
      }
      
      // E-Mail-Optionen
      const customerMailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Reservierung storniert",
        html: `
          <div style="font-family: 'Arial', sans-serif; color: #333; max-width: 700px; margin: 40px auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            
            <!-- Header Section -->
            <div style="background-color: #d9534f; color: white; text-align: center; padding: 30px 20px;">
              <h1 style="margin: 0; font-size: 32px;">Reservierung storniert</h1>
              <p style="margin: 10px 0 0; font-size: 18px;">Ihre Reservierung wurde erfolgreich storniert</p>
            </div>
      
            <!-- Body Section -->
            <div style="padding: 40px;">
              <p style="font-size: 20px; margin-bottom: 30px; color: #555;">Sehr geehrte/r <strong>${reservation.vorname} ${reservation.nachname}</strong>,</p>
              
              <p style="font-size: 16px; line-height: 1.8; color: #666;">
                Wir bedauern, Ihnen mitteilen zu müssen, dass Ihre Reservierung für das Fahrzeug 
                <strong>${reservation.carRent.carName}</strong> am 
                <strong>${formattedPickupDate}</strong> um <strong>${formattedPickupTime}</strong> storniert wurde. 
                Bitte kontaktieren Sie uns, falls Sie Fragen haben.
              </p>
      
              <h2 style="color: #333; margin-top: 40px; padding-bottom: 12px; border-bottom: 2px solid #eee;">
                Details der Reservierung:
              </h2>
              <ul style="list-style: none; padding: 0; font-size: 16px;">
                <li style="padding: 12px 0;"><strong>🚗 Fahrzeug:</strong> ${reservation.carRent.carName}</li>
                <li style="padding: 12px 0;"><strong>📅 Abholdatum:</strong> ${formattedPickupDate} um ${formattedPickupTime}</li>
                <li style="padding: 12px 0;"><strong>📅 Rückgabedatum:</strong> ${formattedReturnDate} um ${formattedReturnTime}</li>
                <li style="padding: 12px 0;"><strong>💰 Gesamtpreis:</strong> ${reservation.gesamtPrice} €</li>
              </ul>
      
              <div style="text-align: center; margin: 40px 0;">
                <img src="data:image/webp;base64,${base64Image}" alt="Fahrzeugbild"
                     style="max-width: 280px; height: auto; border-radius: 10px; pointer-events: none; user-select: none; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);"/>
                <p style="font-size: 14px; color: #888;">Ihr reserviertes Fahrzeug</p>
              </div>
            </div>
      
            <!-- Footer Section -->
            <div style="background-color: #f5f5f5; text-align: center; padding: 20px;">
              <p style="font-size: 15px; color: #777; margin: 0;">Falls Sie Fragen haben, kontaktieren Sie uns unter</p>
              <a href="mailto:autoservice.aundo@gmail.com" style="color: #d9534f; font-size: 16px; text-decoration: none;">autoservice.aundo@gmail.com</a>
              <p style="margin-top: 20px; font-size: 14px; color: #999;">© 2024 A&O . Alle Rechte vorbehalten.</p>
            </div>
          </div>
        `,
      };
      
    try {
      await transporter.sendMail(customerMailOptions);
    } catch (emailError) {
      console.error("Fehler beim Versenden der E-Mail:", emailError);
      return res.status(500).json({
        message: "Reservierung storniert, aber E-Mail-Versand fehlgeschlagen.",
      });
    }
    await Reservation.findByIdAndDelete(reservationId);
    res.status(200).json({ message: "Reservierung erfolgreich storniert" });
  } catch (error) {
    console.error("Fehler bei der Ablehnung:", error);
    res.status(500);
  }
});
