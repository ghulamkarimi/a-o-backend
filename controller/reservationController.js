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
console.log("newReservation._id",newReservation._id)
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
      `)
    }

    const bookingDateTime = new Date(reservation.createdAt); // Zeit der Buchung
    const currentDateTime = new Date();
    const timeDiff = currentDateTime - bookingDateTime; // Zeitdifferenz in Millisekunden

    // Überprüfen, ob weniger als 24 Stunden seit der Buchung vergangen sind
    if (timeDiff > 24 * 60 * 60 * 1000) { // 24 Stunden in Millisekunden
      return res.status(400).json({
        message: "Die Reservierung kann nur innerhalb von 24 Stunden nach der Buchung storniert werden.",
      });
    }

    // Reservierung stornieren
    reservation.isReserviert = false;
    reservation.reservierungStatus = "cancelled";
    await reservation.save();

    // Fahrzeug-Slots freigeben
    const carRent = await CarRent.findById(reservation.carRent);
    carRent.bookedSlots = carRent.bookedSlots.filter(slot => {
      return !(slot.start <= new Date(reservation.pickupDate) && slot.end >= new Date(reservation.pickupDate));
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

    res
      .status(200)
      .send(`
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h1 style="text-align: center; color: #4CAF50;">Reservierung erfolgreich storniert</h1>
          <p>Die Reservierung wurde storniert, und eine E-Mail wurde an den Kunden gesendet.</p>
          <a href="/reservation" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Zurück zu den Reservierungen</a>
        </div>
      `);
  } catch (error) {
    console.error("Fehler bei der Ablehnung:", error);
    res
      .status(500)
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
  console.log("reservationId",reservationId)
  const { paymentStatus, isBooked } = req.body; 
  console.log("paymentStatus",paymentStatus)


  try {
    // Reservierung finden
    const reservation = await Reservation.findById(reservationId);
   console.log("reservation",reservation)
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
    const reservations = await Reservation.find().populate("user")
    .populate("carRent"); 
    res.status(200).json({ reservation: reservations || [] });
    
  } catch (error) {
    throw new Error("reservation not found");
  }
});
