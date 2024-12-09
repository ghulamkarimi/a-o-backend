import express from "express"
import { createReservation ,updateReservationStatus} from "../controller/reservationController.js"



const reservationRouter = express.Router()


reservationRouter.post("/create",createReservation)
reservationRouter.put("/update-status/:reservationId", updateReservationStatus);





export default reservationRouter