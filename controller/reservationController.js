import asyncHandler from "express-async-handler";
import CarRent from "../models/carRentModel.js";
import User from "../models/userModel.js";
import Reservation from "../models/reservationModel.js";
import nodeMailer from "nodemailer";
import dotenv from "dotenv";
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
      carRent: carRentId,
      user: user ? user._id : null,
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
      paymentStatus: "pending", // Zahlung ist derzeit im status "pending"
    });

    await newReservation.save();

    // Setze isReserviert auf true für das Fahrzeug
    carRent.isReserviert = false;
    await carRent.save();

    // E-Mail an den Kunden senden
    const customerMailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reservierungsbestätigung",
      html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="text-align: center;">Reservierungsbestätigung</h1>
                <p>Hallo ${vorname} ${nachname},</p>
                <p>Ihre Reservierung wurde erfolgreich erstellt, aber sie wartet auf Bestätigung.</p>
                <h2>Details Ihrer Reservierung:</h2>
                <ul>
                  <li><strong>Fahrzeug:</strong> ${carRent.carName}</li>
                  <li><strong>Abholdatum:</strong> ${pickupDate} um ${pickupTime}</li>
                  <li><strong>Rückgabedatum:</strong> ${returnDate} um ${returnTime}</li>
                  <li><strong>Gesamtpreis:</strong> ${gesamtPrice} €</li>
                </ul>
                <p>Vielen Dank für Ihre Reservierung!</p>
                 <a href="http://localhost:7001/reservation/reject-reservation/${newReservation._id}" style="background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Ablehnen</a>
              </div>
            `,
    };

    // E-Mail an den Admin senden
    const adminMailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL, // E-Mail-Adresse des Admins
      subject: "Neue Fahrzeugreservierung",
      html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="text-align: center;">Neue Fahrzeugreservierung</h1>
                <p>Eine neue Reservierung wurde erstellt:</p>
                <ul>
                  <li><strong>Kunde:</strong> ${vorname} ${nachname}</li>
                  <li><strong>E-Mail:</strong> ${email}</li>
                  <li><strong>Fahrzeug:</strong> ${carRent.carName}</li>
                  <li><strong>Abholdatum:</strong> ${pickupDate} um ${pickupTime}</li>
                  <li><strong>Rückgabedatum:</strong> ${returnDate} um ${returnTime}</li>
                  <li><strong>Gesamtpreis:</strong> ${gesamtPrice} €</li>
                </ul>
                <p>Für weitere Aktionen können Sie die Reservierung bestätigen oder ablehnen:</p>
                <p>
                  <a href="http://localhost:7001/reservation/confirm-reservation/${newReservation._id}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Bestätigen</a>
                  <a href="http://localhost:7001/reservation/reject-reservation/${newReservation._id}" style="background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Ablehnen</a>
                </p>
              </div>
            `,
    };

    // E-Mails senden
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.status(201).json({
      message: "Reservierung erfolgreich erstellt und E-Mails versendet.",
      reservation: newReservation,
    });
  } catch (error) {
    console.error("Fehler bei der Reservierung:", error);
    res
      .status(500)
      .json({ message: "Fehler bei der Erstellung der Reservierung." });
  }
});

// Endpunkt zum Bestätigen der Reservierung
export const confirmReservation = asyncHandler(async (req, res) => {
  try {
    const reservationId = req.params.reservationId;

    // Reservierung finden
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservierung nicht gefunden." });
    }

    // Reservierungsstatus aktualisieren
    reservation.reservierungStatus = "completed";

    await reservation.save();

    // Fahrzeug finden und Slots aktualisieren
    const carRent = await CarRent.findById(reservation.carRent);
    if (!carRent) {
      return res.status(400).json({ message: "Fahrzeug nicht gefunden." });
    }

    carRent.isReserviert = true;
    const pickupDateTime = new Date(reservation.pickupDate);
    const returnDateTime = new Date(reservation.returnDate);

    // Gebuchte Slots aktualisieren
    carRent.bookedSlots = carRent.bookedSlots || [];
    carRent.bookedSlots.push({
      start: pickupDateTime,
      end: returnDateTime,
    });

    await carRent.save();
    const customerMailOptions = {
      from: process.env.EMAIL,
      to: reservation.email,
      subject: "Reservierungsbestätigung",
      html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                  <h1 style="text-align: center;">Reservierungsbestätigung</h1>
                  <p>Hallo ${reservation.vorname} ${reservation.nachname},</p>
                  <p>Ihre Reservierung wurde erfolgreich bestätigt.</p>
                  <h2>Details Ihrer Reservierung:</h2>
                  <ul>
                      <li><strong>Fahrzeug:</strong> ${carRent.carName}</li>
                      <li><strong>Abholdatum:</strong> ${reservation.pickupDate} um ${reservation.pickupTime}</li>
                      <li><strong>Rückgabedatum:</strong> ${reservation.returnDate} um ${reservation.returnTime}</li>
                      <li><strong>Gesamtpreis:</strong> ${reservation.gesamtPrice} €</li>
                  </ul>
                  <p>Vielen Dank für Ihre Reservierung!</p>
              </div>
          `,
    };

    // E-Mails senden
    await transporter.sendMail(customerMailOptions);

    res.status(200).json({ message: "Reservierung bestätigt.", reservation });
  } catch (error) {
    console.error("Fehler bei der Bestätigung:", error);
    res
      .status(500)
      .json({ message: "Fehler bei der Bestätigung der Reservierung." });
  }
});

// Endpunkt zum Ablehnen der Reservierung
export const rejectReservation = asyncHandler(async (req, res) => {
  try {
    const reservationId = req.params.reservationId;
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservierung nicht gefunden." });
    }

    // Überprüfe, ob der aktuelle Zeitpunkt mehr als 24 Stunden vor dem Abholdatum liegt
    const pickupDateTime = new Date(reservation.pickupDate);
    const currentDateTime = new Date();
    const timeDiff = pickupDateTime - currentDateTime;

    if (timeDiff <= 24 * 60 * 60 * 1000) { // 24 Stunden in Millisekunden
      return res.status(400).json({ message: "Die Reservierung kann innerhalb von 24 Stunden vor dem Abholdatum nicht storniert werden." });
    }

    reservation.isReserviert = false;
    await reservation.save();

    const carRent = await CarRent.findById(reservation.carRent);
    carRent.bookedSlots = [];
    carRent.isReserviert = false;
    

    await carRent.save();

    // E-Mail an den Kunden senden
    const customerMailOptions = {
      from: process.env.EMAIL,
      to: reservation.email,
      subject: "Reservierung storniert",
      html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="text-align: center;">Stornierungsbestätigung</h1>
                <p>Hallo ${reservation.vorname} ${reservation.nachname},</p>
                <p>Ihre Reservierung wurde storniert, da Sie diese innerhalb von 24 Stunden vor dem Abholdatum abgelehnt haben.</p>
                <p>Für weitere Informationen wenden Sie sich bitte an den Kundenservice.</p>
              </div>
            `,
    };

    // E-Mail an den Admin senden
    const adminMailOptions = {
      from: process.env.EMAIL,
      to: "khalil.haouas@gmail.com", // E-Mail-Adresse des Admins
      subject: "Reservierung abgelehnt",
      html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="text-align: center;">Reservierung abgelehnt</h1>
                <p>Eine Reservierung wurde storniert:</p>
                <ul>
                  <li><strong>Kunde:</strong> ${reservation.vorname} ${reservation.nachname}</li>
                  <li><strong>E-Mail:</strong> ${reservation.email}</li>
                  <li><strong>Fahrzeug:</strong> ${carRent.carName}</li>
                  <li><strong>Abholdatum:</strong> ${reservation.pickupDate} um ${reservation.pickupTime}</li>
                  <li><strong>Rückgabedatum:</strong> ${reservation.returnDate} um ${reservation.returnTime}</li>
                  <li><strong>Gesamtpreis:</strong> ${reservation.gesamtPrice} €</li>
                </ul>
                <p>Für weitere Informationen wenden Sie sich bitte an den Kundenservice.</p>
              </div>
            `,
    };

    // E-Mails senden
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.status(200).json({ message: "Reservierung abgelehnt und E-Mails versendet." });
  } catch (error) {
    console.error("Fehler bei der Ablehnung:", error);
    res
      .status(500)
      .json({ message: "Fehler bei der Ablehnung der Reservierung." });
  }
});

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const { reservationId } = req.params; // Erwartet die Reservierungs-ID aus der URL
  const { paymentStatus, isBooked } = req.body; // Erwartet die neuen Werte im Body der Anfrage

  try {
    // Reservierung finden
    const reservation = await Reservation.findById(reservationId);

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
    const reservations = await Reservation.find();
    res.status(200).json({ reservation: reservations });
  } catch (error) {
    throw new Error("reservation not found");
  }
});
