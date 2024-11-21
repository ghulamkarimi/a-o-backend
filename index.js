import express from 'express';
import dotenv from 'dotenv';
import { dbConnect } from './dbConnect/dbConnect.js';
import userRouter from './routes/userRouter.js';
import carRentRouter from './routes/carRentRouter.js';
import carBuyRouter from './routes/carBuyRouter.js';
import offerRouter from './routes/offerRouter.js';
import appointmentRouter from './routes/appointmentRouter.js';
import paymentRouter from './routes/paymentRouter.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import compression from 'compression';
import { upload } from './middleware/uploadMiddleware.js';
import schutzPacketRouter from './routes/schutzPacktRouter.js';

dotenv.config();
dbConnect();

const app = express();

// Middleware setup
app.use(express.json());
app.use(compression());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// Routes
app.use('/user', userRouter);
app.use("/rent", carRentRouter);
app.use("/buy", carBuyRouter);
app.use("/offer", offerRouter);
app.use("/appointment", appointmentRouter);
app.use("/payment", paymentRouter);
app.use("/schutzPacket",schutzPacketRouter)
app.post('/upload', upload.array("carImages", 10), (req, res) => {
  try {
    if (req.files) {
      // Hier kannst du die Logik für die Dateiverarbeitung hinzufügen
      res.status(200).json({ message: "Dateien erfolgreich hochgeladen!" });
    } else {
      res.status(400).json({ message: "Keine Dateien zum Hochladen." });
    }
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Hochladen der Dateien.", error: error.message });
  }
});// Verwende den Upload-Handler hier

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
