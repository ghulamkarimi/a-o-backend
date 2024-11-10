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
} from "../controller/userController.js";
import loginLimiter from "../rateLimit/rateLimiter.js";
import { verifyToken } from "../middleware/token/verifyToken.js";


const userRouter = express.Router();

userRouter.post("/register", userRegister);
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

export default userRouter;
