import AppointmentSlot from "../models/appointmentModel.js";
import nodemailer from "nodemailer";
import asyncHandler from "express-async-handler";



// 1. Slots generieren
export const generateSlots = async (req, res) => {
  const { date } = req.body; // Beispiel: "2024-12-04"
  const startTime = new Date(`${date}T08:00:00`); // Startzeit: 08:00 Uhr
  const endTime = new Date(`${date}T18:00:00`); // Endzeit: 18:00 Uhr

  const slots = [];
  let currentTime = startTime;

  while (currentTime < endTime) {
    const nextTime = new Date(currentTime);
    nextTime.setMinutes(nextTime.getMinutes() + 90); // 1,5 Stunden Intervalle

    slots.push({
      date: currentTime,
      status: "available",
    });

    currentTime = nextTime;
  }

  try {
    const createdSlots = await AppointmentSlot.insertMany(slots);
    res.status(201).json({ message: "Slots erfolgreich generiert", createdSlots });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Generieren der Slots", error });
  }
};

// 2. Alle Slots abrufen
export const getSlots = asyncHandler(async (req, res) => {
  try {
      const slots = await AppointmentSlot.find();
      res.json(slots);
  } catch (error) {
      console.error("Fehler beim Abrufen der Slots:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Slots", error: error.message });
  }
});


// 3. Slot buchen
export const bookSlot = async (req, res) => {
  const { slotId, customerDetails } = req.body;

  try {
    const slot = await AppointmentSlot.findById(slotId);

    if (!slot || slot.status !== "available") {
      return res.status(400).json({ message: "Slot nicht verfügbar" });
    }

    slot.status = "booked";
    slot.customerDetails = customerDetails;
    await slot.save();

    // Bestätigungs-E-Mail senden
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS_MAIL,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: customerDetails.email,
      subject: "Terminbestätigung",
      html: `
        <h1>Terminbestätigung</h1>
        <p>Ihr Termin für den Service <strong>${slot.service}</strong> wurde erfolgreich gebucht.</p>
        <p>Datum und Zeit: ${new Date(slot.date).toLocaleString()}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Slot gebucht und Bestätigungs-E-Mail gesendet", slot });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Buchen des Slots", error });
  }
};

// 4. Slot blockieren oder freigeben
export const updateSlotStatus = async (req, res) => {
  const { slotId } = req.params; // Slot-ID aus den URL-Parametern
  const { status } = req.body; // Neuer Status aus dem Anfrage-Body

  try {
    // 1. Slot anhand der ID suchen
    const slot = await AppointmentSlot.findById(slotId);

    // 2. Überprüfen, ob der Slot existiert
    if (!slot) {
      console.error(`❌ Slot mit ID ${slotId} wurde nicht gefunden.`);
      return res.status(404).json({ message: "Slot nicht gefunden" });
    }

    // 3. Validieren, ob der neue Status erlaubt ist
    const validStatuses = ["available", "blocked", "booked", "confirmed"];
    if (!validStatuses.includes(status)) {
      console.error(`❌ Ungültiger Status: ${status}`);
      return res.status(400).json({ message: "Ungültiger Status" });
    }

    // 4. Slot-Status aktualisieren
    slot.status = status;
    await slot.save();

    // 5. WebSocket-Update senden, wenn die Instanz existiert
    const io = req.app.get("io");
    if (io) {
      io.emit("slotUpdated", {
        slotId: slot._id,
        status: slot.status,
      });
      console.log(`✅ WebSocket-Event 'slotUpdated' gesendet für Slot ID: ${slot._id}`);
    } else {
      console.warn("⚠️ WebSocket-Instanz ist nicht verfügbar.");
    }

    // 6. Erfolgreiche Antwort an den Client senden
    res.status(200).json({
      message: `Slot wurde erfolgreich auf ${status} aktualisiert.`,
      slotId: slot._id,
      status: slot.status,
    });
  } catch (error) {
    // 7. Fehler behandeln und Rückmeldung an den Client
    console.error("❌ Fehler beim Aktualisieren des Slots:", error.message);
    res.status(500).json({
      message: "Interner Fehler beim Aktualisieren des Slots",
      error: error.message,
    });
  }
};




// 5. Gebuchten Slot bestätigen
export const confirmSlot = async (req, res) => {
  const { slotId } = req.params;

  try {
    const slot = await AppointmentSlot.findById(slotId);

    if (!slot || slot.status !== "booked") {
      return res.status(400).json({ message: "Slot kann nicht bestätigt werden" });
    }

    slot.status = "confirmed";
    await slot.save();

    // Bestätigungs-E-Mail an den Kunden senden
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS_MAIL,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: slot.customerDetails.email,
      subject: "Termin bestätigt",
      html: `
        <h1>Termin bestätigt</h1>
        <p>Ihr Termin wurde erfolgreich bestätigt.</p>
        <p>Datum und Zeit: ${new Date(slot.date).toLocaleString()}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Slot bestätigt und E-Mail gesendet", slot });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Bestätigen des Slots", error });
  }
};

