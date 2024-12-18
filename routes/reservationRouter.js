import express from "express"
import { createReservation ,getAllReservation,updateReservationStatus,rejectReservation,confirmReservation} from "../controller/reservationController.js"



const reservationRouter = express.Router()



reservationRouter.get("/get-reservation",getAllReservation)
reservationRouter.post("/create",createReservation)
reservationRouter.put("/update-status/:reservationId", updateReservationStatus);
reservationRouter.put("/reject-reservation/:reservationId", rejectReservation);
reservationRouter.get("/confirm-reservation/:reservationId",confirmReservation) 




export default reservationRouter