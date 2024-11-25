import express from "express";
import {
  userRegister,
  userLogin,
  userLogout,
  getAllUsers,
  userEdit,
  deleteAccount,
  changePasswordByLoginUser,
  confirmEmail,
  confirmEmailVerificationCode,
  changePasswordWithEmail,
  userRefreshToken,
  profilePhotoUpload,
} from "../controller/userController.js";
import loginLimiter from "../rateLimit/rateLimiter.js";
import { verifyToken } from "../middleware/token/verifyToken.js";
import { userRegisterValidator } from "../middleware/validator/userValidator.js";

import { upload } from "../middleware/upload.js";


const userRouter = express.Router();

userRouter.post("/register", userRegisterValidator,userRegister);
userRouter.post("/login", loginLimiter,userLogin);
userRouter.delete("/logout", userLogout);
userRouter.post("/refreshToken", userRefreshToken);
userRouter.get("/allUsers", getAllUsers);
userRouter.put("/update/", verifyToken, userEdit);
userRouter.delete("/deleteUser/:id", verifyToken, deleteAccount);
userRouter.put("/changePassword", verifyToken, changePasswordByLoginUser);
userRouter.post("/confirmEmail", confirmEmail);
userRouter.post("/confirmVerificationCode", confirmEmailVerificationCode);
userRouter.put("/changePasswordWithEmail", changePasswordWithEmail);
userRouter.post(
  "/profile/photo",
  verifyToken, // Authentifizierungsmiddleware
  upload.single("userImage"), // Middleware für Datei-Uploads
  profilePhotoUpload // Funktion für Profilbild-Upload
);
export default userRouter;
