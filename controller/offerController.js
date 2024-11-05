import asyncHandler from 'express-async-handler'
import Offer from '../models/offerModel.js'
import { checkAdmin } from '../middleware/validator/checkAdmin.js'

export const createOffer = asyncHandler(async(req,res)=> {
    const {title,description,oldPrice,newPrice,imageUrl,userId} = req.body
    try {
        const user = await checkAdmin(userId)
        const offer = await Offer({
            title,
            description,
            oldPrice,
            newPrice,
            imageUrl,
            userId: user._id
        })
        const createdOffer = await offer.save()
        res.status(201).json(createdOffer)
    } catch (error) {
        console.log("Error in created",error)
    }
})

export const getOffers = asyncHandler(async(req,res)=> {
    const offers = await Offer.find();
    res.json(offers)
});

export const editOffer = asyncHandler(async(req,res)=> {
    const {title,description,oldPrice,newPrice,imageUrl,userId,offerId,discountPercentage} = req.body
    if(!offerId){
        res.status(400)
        throw new Error("invalid offer id")
    }
    if(!userId){
        res.status(400)
        throw new Error("invalid user id")
    }
    try {
        const user = await checkAdmin(userId)
        if(!user){
            res.status(400)
            throw new Error("invalid user")
        }
        const offer = await Offer.findById(offerId)
        if(!offer){
            res.status(404)
            throw new Error("Offer not found")
        }
        offer.title = title
        offer.description = description
        offer.oldPrice = oldPrice
        offer.newPrice = newPrice
        offer.imageUrl = imageUrl
        offer.discountPercentage = discountPercentage
        const updatedOffer = await offer.save()
        res.json(updatedOffer)
    } catch (error) {
        console.log("Error in update",error)
    }
})
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
      const user = await checkAdmin(userId);
      if (!user) {
        res.status(400);
        throw new Error("Invalid user");
      }
  
     
      const offer = await Offer.findByIdAndDelete(offerId);
      if (!offer) {
        res.status(404);
        throw new Error("Offer not found");
      }
  
      res.json({ message: "Offer deleted" });
    } catch (error) {
      console.log("Error in delete", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

