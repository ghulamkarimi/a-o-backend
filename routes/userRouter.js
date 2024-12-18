import express from "express";
import {
  userRegister,
  userLogin,
  userLogout,
  getAllUsers,
  userEdit,
  deleteAccount,
  changePasswordByLoginUser,
  requestPasswordReset,
  confirmEmailVerificationCode,
  changePasswordWithEmail,
  refreshToken,
  profilePhotoUpload,
} from "../controller/userController.js";
// import loginLimiter from "../rateLimit/rateLimiter.js";
import { verifyToken } from "../middleware/token/verifyToken.js";
import { userRegisterValidator } from "../middleware/validator/userValidator.js";

import { upload } from "../middleware/upload.js";


const userRouter = express.Router();

userRouter.post("/register", userRegisterValidator,userRegister);
// userRouter.post("/login", loginLimiter,userLogin);
 userRouter.post("/login",userLogin);
userRouter.delete("/logout", userLogout);
userRouter.post("/refreshToken", refreshToken);
userRouter.get("/allUsers", getAllUsers);
userRouter.put("/update/", verifyToken, userEdit);
userRouter.delete("/deleteAccount", verifyToken, deleteAccount);
userRouter.put("/changePassword", verifyToken, changePasswordByLoginUser);
userRouter.post("/requestPasswordReset", requestPasswordReset);
userRouter.post("/confirmVerificationCode", confirmEmailVerificationCode);
userRouter.put("/changePasswordWithEmail", changePasswordWithEmail);
userRouter.put(
  "/profile/photo",
  verifyToken,
  (req, res, next) => {
    upload.single("userImage")(req, res, (err) => {
      if (err) {
        console.error("Multer Fehler:", err.message);
        return res.status(400).json({ message: `Multer Fehler: ${err.message}` });
      }
      next();
    });
  },
  profilePhotoUpload
);


export default userRouter;
