import express from 'express';
import dotenv from 'dotenv';
import { dbConnect } from './dbConnect/dbConnect.js';
import userRouter from './routes/userRouter.js';
import carRentRouter from './routes/carRentRouter.js'; 
import carBuyRouter from './routes/carBuyRouter.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import compression from 'compression';

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
app.use(bodyParser.json());

// Routes
app.use('/user', userRouter);
app.use("/rent", carRentRouter);
app.use("/buy", carBuyRouter);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

