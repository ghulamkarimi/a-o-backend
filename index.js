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
import schutzPacketRouter from './routes/schutzPacktRouter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http'; // Hier importierst du createServer für HTTP
import initializeSocket from './socket/socket.js'; // Importiere die `initializeSocket`-Funktion


dotenv.config();


dbConnect();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);


const io = initializeSocket(server);
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.use(cors({
     origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Definiere die verschiedenen Routen
app.use('/user', userRouter);
app.use("/rent", carRentRouter);
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use("/buy", carBuyRouter);
app.use("/offer", offerRouter);
app.use("/appointment", appointmentRouter);
app.use("/payment", paymentRouter);
app.use("/schutzPacket", schutzPacketRouter);

// Starte den Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
