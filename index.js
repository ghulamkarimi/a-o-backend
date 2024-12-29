import express from 'express';
import dotenv from 'dotenv';
import { dbConnect } from './dbConnect/dbConnect.js';
import userRouter from './routes/userRouter.js';
import carRentRouter from './routes/carRentRouter.js';
import carBuyRouter from './routes/carBuyRouter.js';
import offerRouter from './routes/offerRouter.js';
import paymentRouter from './routes/paymentRouter.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import compression from 'compression';
import schutzPacketRouter from './routes/schutzPacktRouter.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import initializeSocket from './socket/socket.js';
import reservationRouter from './routes/reservationRouter.js';
import appointmentRouter from './routes/appointmentRouter.js';

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
app.use(express.json({ limit: '20mb' })); // Erhöht die maximale JSON-Größe
app.use(express.urlencoded({ extended: true, limit: '20mb' })); // Für große Formulardaten
app.use(compression());
app.use(cookieParser());

const allowedOrigins =
process.env.NODE_ENV === "production"
    ? ["https://car-db.aundoautoservice.de","https://aundoautoservice.de" ,"https://www.aundoautoservice.de", "https://admin.aundoautoservice.de"]
   : []
    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.error(`CORS blockiert: ${origin} ist nicht erlaubt`);
            callback(new Error(`CORS blockiert: ${origin} ist nicht erlaubt`));
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "Accept",
          "Origin",
          "X-Requested-With",
        ],
      })
    );
    

app.options('*', cors());


app.use('/images', express.static(path.join(__dirname, 'images')));

// Routen
app.use('/user', userRouter);
app.use('/rent', carRentRouter);
app.use('/buy', carBuyRouter);
app.use('/offer', offerRouter);
app.use('/appointment', appointmentRouter);
app.use('/payment', paymentRouter);
app.use('/schutzPacket', schutzPacketRouter);
app.use('/reservation', reservationRouter);

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error(`❌ Fehler: ${err.message}`);
  res.status(err.status || 500).json({ error: err.message });
});

// Server starten
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
