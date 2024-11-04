import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import { sendVerificationLinkToEmail } from "../email/mailSender.js";

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

    // Kürzere Gültigkeit für das accessToken
    const accessToken = jwt.sign(
      { userId, firstName, lastName, email: userEmail, phone, photo, isAdmin },
      process.env.ACCESS_TOKEN,
      { expiresIn: "15m" } // 15 Minuten
    );

    // Längere Gültigkeit für das refreshToken
    const refreshToken = jwt.sign(
      { userId, firstName, lastName, email: userEmail, phone, photo, isAdmin },
      process.env.REFRESH_TOKEN,
      { expiresIn: "30d" } // 30 Tage
    );

    // Speichere das refreshToken im Benutzerobjekt
    userFound.refreshToken = refreshToken;
    await userFound.save();

    // Setze das accessToken Cookie mit der gleichen Gültigkeit
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 Minuten
      sameSite: "strict",
    });

    // Setze das refreshToken Cookie mit längerer Gültigkeit
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
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

export const userLogout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Verwende den refreshToken aus den Cookies
  console.log("Attempting logout with refreshToken:", refreshToken);

  if (!refreshToken) {
    console.error("No refreshToken found in request");
    return res.status(401).json({ error: "User not logged in" });
  }

  const user = await User.findOne({ refreshToken }); // Finde den Benutzer mit dem refreshToken
  if (!user) {
    console.error("No user associated with provided refreshToken");
    return res.status(404).json({ error: "User not found" });
  }

  // refreshToken aus der Datenbank entfernen
  user.refreshToken = null;
  await user.save();

  // accessToken-Cookie löschen
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  // refreshToken-Cookie löschen
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    message: "User Logged Out Successfully",
  });
});

export const userRefreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Verwende den refreshToken aus den Cookies
  console.log("Attempting to refresh token with refreshToken:", refreshToken);

  if (!refreshToken) {
    console.error("No refreshToken found in request");
    return res.status(401).json({ error: "User not logged in" });
  }

  const user = await User.findOne({ refreshToken }); // Finde den Benutzer mit dem refreshToken
  if (!user) {
    console.error("No user associated with provided refreshToken");
    return res.status(403).json({ error: "Invalid refresh token" });
  }

  // accessToken mit kürzerer Gültigkeit erstellen
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
    { expiresIn: "15m" } // 15 Minuten
  );

  // Setze das accessToken Cookie mit der gleichen Gültigkeit
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000, // 15 Minuten
    sameSite: "strict",
  });

  res.status(200).json({
    message: "Token refreshed successfully",
    accessToken, // Optional: das neue accessToken zurückgeben
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});

export const userEdit = asyncHandler(async (req, res
) => {
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
