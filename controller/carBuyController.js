import asyncHandler from "express-async-handler";
import CarBuy from "../models/carBuyModel.js";
import { checkAdmin } from "../middleware/validator/checkAdmin.js";
import mongoose from "mongoose";

export const createBuyCar = asyncHandler(async (req, res) => {
  console.log(req.body);

  const {
    carTitle,
    carPrice,
    carImage,
    carCategory,
    fuelType,
    owner,
    isSold,
    carDescription,
    carKilometers,
    carColor,
    carAirConditioning,
    carSeat,
    damagedCar,
    carNavigation,
    carParkAssist,
    carAccidentFree,
    carFirstRegistrationDay,
    carGearbox,
    carMotor,
    carHorsePower,
    carTechnicalInspection,
    userId,
  } = req.body;

  try {
    const user = await checkAdmin(userId);
    const carBuy = new CarBuy({
      carTitle,
      carCategory,
      carPrice,
      owner,
      isSold,
      carFirstRegistrationDay,
      carImage,
      carDescription,
      carKilometers,
      carColor,
      carAirConditioning,
      carSeat,
      damagedCar,
      carNavigation,
      carParkAssist,
      carAccidentFree,
      carGearbox,
      carMotor,
      carHorsePower,
      fuelType,
      carTechnicalInspection,
      user: user._id,
    });
    const createdCarBuy = await carBuy.save();
    res.status(201).json(createdCarBuy);
  } catch (error) {
    console.log("Error in createCarBuy", error.message);
    res.status(400).json({ message: error.message });
  }
});

export const getCarBuys = asyncHandler(async (req, res) => {
  const carBuys = await CarBuy.find();
  res.json(carBuys);
});

export const getCarBuysById = asyncHandler(async (req, res) => {
  const carBuy = await CarBuy.findById(req.params.id);
  console.log(carBuy);
  if (carBuy) {
    res.json(carBuy);
  } else {
    res.status(404);
    throw new Error("Car Buy not found");
  }
});

// const deleteImageFromCloudinary = async (publicId) => {
//   const cloudinaryUrl = `https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/destroy`;
//   const data = {
//     public_id: publicId,
//     type: 'upload',
//     invalidate: true,
//   };

//   await axios.post(cloudinaryUrl, data, {
//     headers: {
//       'Authorization': `Bearer YOUR_API_TOKEN`
//     }
//   });
// };




// const getPublicIdFromUrl = (url) => {
//   const segments = url.split('/');
//   const publicIdWithExtension = segments[segments.length - 1];
//   return publicIdWithExtension.split('.')[0]; // Nimm nur die Public ID
// };
// export const deleteCarBuy = asyncHandler(async (req, res) => {
//   const userId = req.body.userId;
//   const carId = req.body.carId;

//   if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
//     res.status(400).json({ message: "Invalid User Id" });
//     return;
//   }

//   if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
//     res.status(400).json({ message: "Invalid Car Id" });
//     return;
//   }

//   try {
//     const user = await checkAdmin(req.body.userId);
//     if (!user) {
//       res.status(400).json({ message: "Invalid User" });
//       return;
//     }

//     const carBuy = await CarBuy.findByIdAndDelete(carId);
//     if (!carBuy) {
//       res.status(400).json({ message: "Car Buy not found" });
//       return;
//     }

//     res.json({ message: "Car Buy deleted successfully" });
//   } catch (error) {
//     console.log("Error in deleteCarBuy", error.message);
//     res.status(400).json({ message: error.message });
//   }
// });


export const deleteCarBuy = asyncHandler(async (req, res) => {
  const userId = req.body.userId;
  const carId = req.body.carId;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid User Id" });
    return;
  }

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    res.status(400).json({ message: "Invalid Car Id" });
    return;
  }

  try {
    const user = await checkAdmin(userId);
    if (!user) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }

    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      res.status(404).json({ message: "Car Buy not found" });
      return;
    }

    // Lösche die Bilder aus Cloudinary
    for (const imageUrl of carBuy.carImage) {
      const publicId = getPublicIdFromUrl(imageUrl);
      await deleteImageFromCloudinary(publicId);
    }

    // Ändere den Verkaufsstatus des Autos
    carBuy.isSold = true;
    await carBuy.save();

    res.json({ message: "Car Buy sold and images deleted successfully" });
  } catch (error) {
    console.log("Error in deleteCarBuy", error.message);
    res.status(400).json({ message: error.message });
  }
});

export const updateCarBuy = asyncHandler(async (req, res) => {
  const {
    carTitle,
    carPrice,
    carImage,
    carCategory,
    fuelType,
    owner,
    isSold,
    carDescription,
    carKilometers,
    carColor,
    carAirConditioning,
    carSeat,
    damagedCar,
    carNavigation,
    carParkAssist,
    carAccidentFree,
    carFirstRegistrationDay,
    carGearbox,
    carMotor,
    carHorsePower,
    carTechnicalInspection,
    userId,
    carId
  } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid User Id" });
    return;
  }

  if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
    res.status(400).json({ message: "Invalid Car Id" });
    return;
  }

  try {
    const user = await checkAdmin(userId);
    if (!user) {
      res.status(400).json({ message: "Invalid User" });
      return;
    }

    const carBuy = await CarBuy.findById(carId);
    if (!carBuy) {
      res.status(404).json({ message: "Car Buy not found" });
      return;
    }

    carBuy.carTitle = carTitle;
    carBuy.carPrice = carPrice;
    carBuy.carImage = carImage;
    carBuy.carCategory = carCategory;
    carBuy.carDescription = carDescription;
    carBuy.carKilometers = carKilometers;
    carBuy.carColor = carColor;
    carBuy.carAirConditioning = carAirConditioning;
    carBuy.carSeat = carSeat;
    carBuy.damagedCar = damagedCar;
    carBuy.carNavigation = carNavigation;
    carBuy.carParkAssist = carParkAssist;
    carBuy.carAccidentFree = carAccidentFree;
    carBuy.carFirstRegistrationDay = carFirstRegistrationDay;
    carBuy.carGearbox = carGearbox;
    carBuy.carMotor = carMotor;
    carBuy.carHorsePower = carHorsePower;
    carBuy.fuelType = fuelType;
    carBuy.owner = owner;
    carBuy.isSold = isSold;
    carBuy.carTechnicalInspection = carTechnicalInspection;

    const updatedCarBuy = await carBuy.save();
    res.json(updatedCarBuy);
  } catch (error) {
    console.log("Error in updateCarBuy", error.message);
    res.status(400).json({ message: error.message });
  }
});





