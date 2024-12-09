import asyncHandler from "express-async-handler";
import CarRent from "../models/carRentModel.js"
import User from "../models/userModel.js"
import Reservation from "../models/reservationModel.js"



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
  
    // Helper-Funktion zur Validierung von Datumswerten
    const isValidDate = (date) => !isNaN(new Date(date).valueOf());
  
    try {
      // Überprüfen, ob das Fahrzeug existiert
      const carRent = await CarRent.findById(carRentId);
  
      if (!carRent) {
        return res.status(400).json({ message: "Fahrzeug nicht gefunden." });
      }
  
      // Überprüfen, ob der Benutzer existiert (optional)
      let user = null;
      if (userId) {
        user = await User.findById(userId);
        if (!user) {
          return res.status(400).json({ message: "Benutzer nicht gefunden." });
        }
      }
  
      // Validierung von Datum und Zeit
      const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
      const returnDateTime = new Date(`${returnDate}T${returnTime}`);
  
      if (!isValidDate(pickupDateTime) || !isValidDate(returnDateTime)) {
        return res
          .status(400)
          .json({ message: "Ungültige Kombination aus Datum und Zeit." });
      }
  
      // Reservierung erstellen
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
        paymentStatus: "pending",
      });
  
      // Reservierung speichern
      await newReservation.save();
  
      // Fahrzeug aktualisieren
      carRent.isBooked = true;
      carRent.bookedSlots.push({
        start: pickupDateTime,
        end: returnDateTime,
      });
  
      await carRent.save();
  
      res.status(201).json({
        message: "Reservierung erfolgreich erstellt.",
        reservation: newReservation,
      });
    } catch (error) {
      console.error("Fehler bei der Reservierungserstellung:", error);
      res
        .status(500)
        .json({ message: "Fehler bei der Erstellung der Reservierung." });
    }
  });
  
  

  export const getAllReservation = asyncHandler(async (req, res) => {
    console.log("getAllReservation erreicht");
    try {
        
        const reservations = await Reservation.find()
            .populate('user', 'vorname nachname email') 
            .populate('carRent', 'carModel carBrand'); 
           
        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: "Keine Reservierungen gefunden." });
        }

        res.status(200).json({reservation:reservations});
    } catch (error) {
        console.error("Fehler beim Abrufen der Reservierungen:", error);
        res.status(500).json({ message: "Fehler beim Abrufen der Reservierungen." });
    }
});

  
  export const updateReservationStatus = asyncHandler(async (req, res) => {
    const { reservationId } = req.params;
    const { paymentStatus, isBooked } = req.body;
  
    try {
      // Reservierung suchen
      const reservation = await Reservation.findById(reservationId);
  
      if (!reservation) {
        return res.status(404).json({ message: "Reservierung nicht gefunden." });
      }
  
      // Status der Reservierung aktualisieren
      if (paymentStatus) reservation.paymentStatus = paymentStatus;
      if (typeof isBooked === "boolean") reservation.isBooked = isBooked;
  
      // Änderungen speichern
      await reservation.save();
  
      // Fahrzeug suchen
      const carRent = await CarRent.findById(reservation.carRent);
  
      if (!carRent) {
        return res.status(404).json({ message: "Fahrzeug nicht gefunden." });
      }
  
      // Fahrzeug-Status anpassen
      if (reservation.isBooked) {
        carRent.isBooked = true;
        if (!carRent.bookedSlots.some(slot => 
            slot.start.toISOString() === new Date(`${reservation.pickupDate}T${reservation.pickupTime}`).toISOString() && 
            slot.end.toISOString() === new Date(`${reservation.returnDate}T${reservation.returnTime}`).toISOString())) {
          carRent.bookedSlots.push({
            start: new Date(`${reservation.pickupDate}T${reservation.pickupTime}`),
            end: new Date(`${reservation.returnDate}T${reservation.returnTime}`),
          });
        }
      } else {
        carRent.isBooked = false;
        carRent.bookedSlots = carRent.bookedSlots.filter(slot => 
          slot.start.toISOString() !== new Date(`${reservation.pickupDate}T${reservation.pickupTime}`).toISOString() &&
          slot.end.toISOString() !== new Date(`${reservation.returnDate}T${reservation.returnTime}`).toISOString());
      }
  
      await carRent.save();
  
      res.status(200).json({
        message: "Reservierung und Fahrzeugstatus erfolgreich aktualisiert.",
        reservation,
        carRent,
      });
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Reservierung:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Reservierung." });
    }
  });
  
  