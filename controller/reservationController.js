import asyncHandler from "express-async-handler";
import CarRent from "../models/carRentModel.js";
import User from "../models/userModel.js";
import Reservation from "../models/reservationModel.js";

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
    console.log();
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

    await newReservation.save();

    res.status(201).json({
      message: "Reservierung erfolgreich erstellt",
      reservation: newReservation,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Fehler bei der Erstellung der Reservierung." });
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

    // Änderungen speichern
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
    throw new Error("reservation not found")
  }
});
