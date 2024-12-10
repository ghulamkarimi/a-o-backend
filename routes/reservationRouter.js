import express from "express"
import { createReservation ,getAllReservation,updateReservationStatus} from "../controller/reservationController.js"



const reservationRouter = express.Router()



reservationRouter.get("/get-reservation",getAllReservation)
reservationRouter.post("/create",createReservation)
reservationRouter.put("/update-status/:reservationId", updateReservationStatus);





export default reservationRouter