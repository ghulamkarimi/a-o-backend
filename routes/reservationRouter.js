import express from "express"
import { createReservation ,updateReservationStatus,getAllReservation} from "../controller/reservationController.js"



const reservationRouter = express.Router()


reservationRouter.post("/create",createReservation)
reservationRouter.get("/get-reservation", getAllReservation); 
reservationRouter.put("/update-status/:reservationId", updateReservationStatus);





export default reservationRouter