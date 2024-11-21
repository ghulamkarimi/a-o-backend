import asyncHandler from "express-async-handler";
import { checkAdmin } from "../middleware/validator/checkAdmin.js";
import SchutzPacket from "../models/schutzpaketModel.js";
import User from "../models/userModel.js";
import SchutzpaketModel from "../models/schutzpaketModel.js";

export const createSchutzPacket = asyncHandler(async (req, res) => {
  const { userId, name, deductible, dailyRate, features } = req.body;

  console.log(userId);
  try {
    await checkAdmin(userId);
    const newSchutzPacket = new SchutzPacket({
      name,
      deductible,
      dailyRate,
      features,
      user: User._id,
    });
    const savedSchutzPacket = await newSchutzPacket.save();

    res.status(201).json({
      message: "Schutzpaket erfolgreich erstellt",
      schutzPacket: savedSchutzPacket,
    });
  } catch (error) {
    console.error("Fehler beim Erstellen eines Schutzpakets:", error.message);
    res.status(403).json({ error: error.message });
  }
});

export const deleteSchutzPacket = asyncHandler(async (req, res) => {
  const { userId, schutzPacketId } = req.body;

  try {
    await checkAdmin(userId);
    const schutzPacket = await SchutzpaketModel.findByIdAndDelete(
      schutzPacketId
    );
    if (!schutzPacket) {
      res.status(404).json({ error: "Schutzpaket nicht gefunden" });
    }

    res.status(200).json({
      message: "Schutzpaket erfolgreich gelöscht",
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Schutzpakets:", error.message);
    res.status(500).json({ error: "Fehler beim Löschen des Schutzpakets" });
  }
});

export const getAllSchutzPacket = asyncHandler(async (req, res) => {
  const getSchutzPacket = await SchutzpaketModel.find();
  if (!SchutzpaketModel) {
    res.status(400).json("schutzPacket is not found ");
  }
  res.status(200).json({
    message: "get all Schutzpaket ",
    schutzPacket: getSchutzPacket,
  });
});


export const updateSchutzPacket = asyncHandler(async (req, res) => {
    const { userId, schutzPacketId, name, deductible, dailyRate, features } = req.body;
  
    try {
      
      await checkAdmin(userId);
  
      
      const updatedSchutzPacket = await SchutzpaketModel.findByIdAndUpdate(
        schutzPacketId, 
        {
          name,           
          deductible,     
          dailyRate,     
          features        
        },
        { new: true }    
      );
  
      
      if (!updatedSchutzPacket) {
         res.status(404).json({ error: "Schutzpaket nicht gefunden" });
      }
  
      
      res.status(200).json({
        message: "Schutzpaket erfolgreich aktualisiert",
        schutzPacket: updatedSchutzPacket,
      });
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Schutzpakets:", error.message);
      res.status(500).json({ error: "Fehler beim Aktualisieren des Schutzpakets" });
    }
  });
  