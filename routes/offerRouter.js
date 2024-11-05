import express from 'express'
import { createOffer , editOffer,deleteOffer,getOffers } from '../controller/offerController.js'

const offerRouter = express.Router()

offerRouter.post('/createOffer', createOffer)
offerRouter.get("/getOffers", getOffers)
offerRouter.put("/editOffer", editOffer)
offerRouter.delete("/deleteOffer", deleteOffer)


export default offerRouter