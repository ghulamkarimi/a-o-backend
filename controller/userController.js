import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import { sendVerificationLinkToEmail } from "../email/mailSender.js";
import fs from "fs";
import path from "path";

export const userRegister = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    isAdmin,
    password,
    confirmPassword,
    phone,
  } = req.body;
  const userExist = await User.findOne({ email });

  try {
    if (userExist) throw new Error("User Already Exist");
    if (password !== confirmPassword)
      throw new Error("Password does not match");
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      isAdmin,
    });
    res.json({
      user,
      message: "User Registered Successfully",
    });
  } catch (error) {
    console.log(error, "error in userRegister");
    res.json(error);
  }
});

export const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("Attempting to log in user with email:", email);

  const userFound = await User.findOne({ email });
  if (!userFound) {
    throw new Error("User not found");
  }

  if (userFound && (await userFound.isPasswordMatch(password))) {
    const {
      _id: userId,
      firstName,
      lastName,
      email: userEmail,
      phone,
      profile_photo: photo,
      isAdmin,
    } = userFound;

    const accessToken = jwt.sign(
      { userId, firstName, lastName, email: userEmail, phone, photo, isAdmin },
      process.env.ACCESS_TOKEN,
      { expiresIn: "10s" }
    );

    const refreshToken = jwt.sign(
      { userId, firstName, lastName, email: userEmail, phone, photo, isAdmin },
      process.env.REFRESH_TOKEN,
      { expiresIn: "30d" }
    );

    userFound.refreshToken = refreshToken;
    await userFound.save();

  
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    const decoded = jwtDecode(accessToken);

    res.status(200).json({
      message: "User Logged In Successfully",
      userInfo: decoded,
    });
  } else {
    throw new Error("Invalid email or password");
  }
});

export const userLogout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    console.error("Fehler: Refresh Token fehlt.");
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    // Benutzer anhand des Tokens finden
    const user = await User.findOne({ refreshToken: token });
    if (!user) {
      console.error("Fehler: Benutzer mit Refresh Token nicht gefunden.");
      return res.status(404).json({ message: "User not found" });
    }

    // Refresh-Token entfernen
    user.refreshToken = undefined;
    await user.save();

    // Cookie löschen
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Logout erfolgreich" });
  } catch (error) {
    console.error("Fehler beim Logout:", error.message);
    return res.status(500).json({ message: "Logout failed" });
  }
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const accessToken = jwt.sign(
      {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        photo: user.profile_photo,
        isAdmin: user.isAdmin,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge:30 * 24 * 60 * 60 * 1000, // 15 Minuten
      sameSite: "strict",
    });

    // Antworte mit dem neuen Access-Token
    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});

export const userEdit = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const userId = req.user.userId;
    console.log("userId", userId); // Change this if your JWT has a different structure

    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email, phone },
      { new: true, runValidators: true } // Added runValidators to enforce schema validation
    );
    console.log("update User:", user); // Log the updated user

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user,
      message: "User Updated Successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

export const changePasswordByLoginUser = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { password, newPassword, confirmPassword } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user && (await user.isPasswordMatch(password))) {
    if (newPassword !== confirmPassword) {
      throw new Error("Password does not match");
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } else {
    throw new Error("Invalid credentials");
  }
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const loginUserID = req.userId;
  const { id: targetUserID } = req.params;
  const loginUser = await User.findById(loginUserID);
  if (!loginUser) {
    throw new Error("User not found");
  }
  if (loginUser.isAdmin || loginUserID === targetUserID) {
    await User.findByIdAndDelete(targetUserID);
    res.json({ message: "User deleted successfully" });
  } else {
    throw new Error("You are not authorized to perform this action");
  }
});

export const confirmEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.email) {
    throw new Error("Email not found");
  }
  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  user.verificationCode = verificationCode.toString();
  await user.save();
  sendVerificationLinkToEmail(user.email, user.firstName, verificationCode);
  res.json({
    message: "Verification code sent to your email",
    verificationCode,
    email,
  });
});

export const changePasswordWithEmail = asyncHandler(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }
  if (user) {
    if (newPassword !== confirmPassword) {
      throw new Error("Password does not match");
    }
    user.password = newPassword;
    await user.save();
    res.json({
      message: "Password changed successfully",
      user: user,
    });
  } else {
    throw new Error("Invalid credentials");
  }
});

export const confirmEmailVerificationCode = asyncHandler(async (req, res) => {
  const { email, verificationCode } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }
  if (
    user.verificationCode &&
    verificationCode.toString() === user.verificationCode.toString()
  ) {
    user.verificationCode = "";
    user.isAccountVerified = true;
    await user.save();
    console.log("Verification Code:", user.verificationCode);

    res.json({
      message: "Email verified successfully",
      user: user,
    });
  } else {
    throw new Error("Invalid verification code");
  }
});

export const profilePhotoUpload = asyncHandler(async (req, res) => {
  const userId = req.userId; // Benutzer-ID aus dem Token

  if (!req.file) {
    return res.status(400).json({ message: "Keine Datei hochgeladen" });
  }

  const filePath = `${req.protocol}://${req.get("host")}/${req.file.path}`;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    // Altes Profilbild löschen (falls vorhanden)
    if (user.profile_photo && user.profile_photo !== "default_avatar_url") {
      const oldPath = path.resolve(
        `./${user.profile_photo.split(req.get("host"))[1]}`
      );

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Neues Profilbild speichern
    user.profile_photo = filePath;
    await user.save();

    res
      .status(200)
      .json({
        message: "Profilbild erfolgreich aktualisiert",
        profile_photo: user.profile_photo,
      });
  } catch (error) {
    res.status(500).json({ message: "Interner Serverfehler" });
  }
});
