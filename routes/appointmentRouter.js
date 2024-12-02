import express from "express";
import {
  generateSlots,
  getSlots,
  bookSlot,
  updateSlotStatus,
  confirmSlot,
} from "../controller/appointmentController.js";

const router = express.Router();

router.post("/generate", generateSlots); // Slots generieren
router.patch("/:slotId", updateSlotStatus); // Slot blockieren oder freigeben
router.patch("/:slotId/confirm", confirmSlot); // Gebuchten Slot bestätigen
router.get("/", getSlots); // Alle Slots abrufen
router.post("/book", bookSlot); // Slot buchen

export default router;
