import asyncHandler from 'express-async-handler';
import Offer from '../models/offerModel.js';
import { checkAdmin } from '../middleware/validator/checkAdmin.js';
import fs from 'fs';
import path from 'path';


export const createOffer = asyncHandler(async (req, res) => {
    try {
        const { title, description, oldPrice, newPrice, userId } = req.body;

        // Prüfen, ob der Benutzer Admin ist
        const user = await checkAdmin(userId);
        if (!user) {
            res.status(400);
            throw new Error("Invalid user");
        }

        const BASE_URL = process.env.BASE_URL || `${process.env.BASE_URL }`;
        const imageUrl = `${BASE_URL}/${req.file.path.replace(/\\/g, '/')}`;

        // Neues Angebot erstellen
        const offer = new Offer({
            title,
            description,
            oldPrice,
            newPrice,
            imageUrl,
            userId: user._id,
        });

        const createdOffer = await offer.save();
        res.status(201).json(createdOffer);

        // WebSocket-Benachrichtigung senden
        req.io.emit('offerCreated', createdOffer);
    } catch (error) {
        console.error("Error in creating offer:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export const editOffer = asyncHandler(async (req, res) => {
    const { title, description, oldPrice, newPrice, imageUrl, userId, offerId, discountPercentage } = req.body;
    console.log("Received data:", { title, description, oldPrice, newPrice, imageUrl, userId, offerId, discountPercentage });

    if (!offerId) {
        res.status(400);
        throw new Error("Invalid offer id");
    }
    if (!userId) {
        res.status(400);
        throw new Error("Invalid user id");
    }

    try {
        const user = await checkAdmin(userId);
        if (!user) {
            res.status(400);
            throw new Error("Invalid user");
        }

        const offer = await Offer.findById(offerId);
        if (!offer) {
            res.status(404);
            throw new Error("Offer not found");
        }

        // Angebot aktualisieren
        offer.title = title;
        offer.description = description;
        offer.oldPrice = oldPrice;
        offer.newPrice = newPrice;
        offer.discountPercentage = discountPercentage;

        // Wenn ein neues Bild hochgeladen wurde, lösche das alte Bild
        if (req.file) {
            const BASE_URL = process.env.BASE_URL || `${process.env.BASE_URL }`;
            const newImageUrl = `${BASE_URL}/${req.file.path.replace(/\\/g, '/')}`;

            // Lösche das alte Bild, wenn es existiert
            if (offer.imageUrl) {
                const oldImagePath = path.join(process.cwd(), offer.imageUrl.replace(BASE_URL, ''));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log(`Deleted old image: ${oldImagePath}`);
                }
            }

            // Aktualisiere das Bild im Angebot
            offer.imageUrl = newImageUrl;
        } else {
            offer.imageUrl = req.body.imageUrl; // Verwende das alte Bild, wenn kein neues hochgeladen wurde
        }

        const updatedOffer = await offer.save();
        res.json(updatedOffer);

        // WebSocket-Benachrichtigung senden
        req.io.emit('offerUpdated', updatedOffer);
    } catch (error) {
        console.log("Error in update", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export const getOffers = asyncHandler(async (req, res) => {
    const offers = await Offer.find();
    res.json(offers);
});







export const deleteOffer = asyncHandler(async (req, res) => {
    const { userId, offerId } = req.body;

    if (!offerId) {
        res.status(400);
        throw new Error("Invalid offer id");
    }
    if (!userId) {
        res.status(400);
        throw new Error("Invalid user id");
    }

    try {
        // Prüfen, ob der Benutzer Admin ist
        const user = await checkAdmin(userId);
        if (!user) {
            res.status(400);
            throw new Error("Invalid user");
        }

        // Finde das Angebot, bevor es gelöscht wird, um den Bildpfad zu erhalten
        const offer = await Offer.findById(offerId);
        if (!offer) {
            res.status(404);
            throw new Error("Offer not found");
        }

        // Lösche das Bild, falls es existiert
        if (offer.imageUrl) {
            const BASE_URL = process.env.BASE_URL || `${process.env.BASE_URL }`;
            const imagePath = path.join(process.cwd(), offer.imageUrl.replace(BASE_URL, ''));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Deleted image: ${imagePath}`);
            }
        }

        // Lösche das Angebot aus der Datenbank
        await Offer.findByIdAndDelete(offerId);

        res.json({ message: "Offer deleted" });

        // WebSocket-Benachrichtigung senden
        req.io.emit('offerDeleted', offerId);
    } catch (error) {
        console.log("Error in delete", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

