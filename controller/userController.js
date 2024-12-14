import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import { sendVerificationLinkToEmail } from "../email/mailSender.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

export const generateUniqueCustomerNumber = async () => {
  let isUnique = false;
  let customerNumber;

  while (!isUnique) {
    customerNumber = Math.floor(
      100000000 + Math.random() * 900000000
    ).toString();
    const existingUser = await User.findOne({ customerNumber });

    if (!existingUser) {
      isUnique = true;
    }
  }

  return customerNumber;
};

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
    const customerNumber = await generateUniqueCustomerNumber();
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      isAdmin,
      customerNumber,
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
      customerNumber,
    } = userFound;

    const accessToken = jwt.sign(
      {
        userId,
        firstName,
        lastName,
        email: userEmail,
        phone,
        photo,
        isAdmin,
        customerNumber,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "10m" }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        firstName,
        lastName,
        email: userEmail,
        phone,
        photo,
        isAdmin,
        customerNumber,
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: "1d" }
    );

    userFound.refreshToken = refreshToken;
    await userFound.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
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

    if (!user || user.refreshToken !== refreshToken) {
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
        customerNumber: user.customerNumber,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "10s" } // Verlängern Sie die Gültigkeit, z. B. auf 15 Minuten
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 1000, // 10 Minuten
      sameSite: "strict",
    });

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
  const { firstName, lastName, email, phone } = req.body;
  const userId = req.userId;
  console.log("userId", userId);
  try {
    // Change this if your JWT has a different structure

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
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Authentifizierung erforderlich." });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden." });
    }

    // Profilbild löschen, falls vorhanden
    if (
      user.profile_photo &&
      !user.profile_photo.includes("default_avatar_url")
    ) {
      const relativePath = user.profile_photo.split(
        `${req.protocol}://${req.get("host")}/`
      )[1];
      if (relativePath) {
        const filePath = path.join(process.cwd(), relativePath);

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Fehler beim Löschen des Profilbildes:", err.message);
          } else {
            console.log(`Profilbild gelöscht: ${filePath}`);
          }
        });
      }
    }

    // Benutzerkonto löschen
    await User.findByIdAndDelete(userId);

    // Cookies entfernen
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", // Gleicher Pfad wie beim Setzen des Cookies
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/refresh", // Gleicher Pfad wie beim Setzen des Cookies
    });

    res.status(200).json({
      message:
        "Ihr Konto wurde erfolgreich gelöscht. Alle zugehörigen Daten wurden entfernt.",
    });
  } catch (error) {
    console.error("Fehler beim Löschen des Kontos:", error.message);
    res.status(500).json({ message: "Interner Serverfehler." });
  }
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Benutzer nicht gefunden.");
  }

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const hashedCode = await bcrypt.hash(verificationCode, 10);
  user.verificationCode = hashedCode;
  user.verificationCodeExpires = Date.now() + 15 * 60 * 1000; // Ablaufzeit: 15 Minuten
  await user.save();
  await sendVerificationLinkToEmail(
    user.email,
    user.firstName,
    verificationCode
  );

  res.json({
    message: "Verifizierungscode wurde an Ihre E-Mail gesendet.",
  });
});

export const confirmEmailVerificationCode = asyncHandler(async (req, res) => {
  const { email, verificationCode } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Benutzer nicht gefunden.");
  }

  // Sicherstellen, dass ein Code existiert und nicht abgelaufen ist
  if (!user.verificationCode) {
    throw new Error("Verifizierungscode fehlt.");
  }

  if (!user.verificationCodeExpires) {
    throw new Error("Ablaufzeit des Codes fehlt.");
  }

  if (Date.now() > user.verificationCodeExpires) {
    throw new Error("Der Verifizierungscode ist abgelaufen.");
  }

  // Sicherstellen, dass der `verificationCode` sowohl im Body als auch im User-Objekt vorhanden ist
  if (!verificationCode) {
    throw new Error("Verifizierungscode muss angegeben werden.");
  }

  // Vergleiche den übergebenen `verificationCode` mit dem gespeicherten Hash
  const isValidCode = await bcrypt.compare(
    verificationCode,
    user.verificationCode
  );
  if (!isValidCode) {
    throw new Error("Ungültiger Verifizierungscode.");
  }

  // Wenn der Code korrekt ist, lösche ihn und markiere den Benutzer als verifiziert
  user.verificationCode = null;
  user.verificationCodeExpires = null;
  user.isAccountVerified = true;
  await user.save();

  res.json({
    message: "E-Mail erfolgreich verifiziert.",
    user: {
      email: user.email,
      isAccountVerified: user.isAccountVerified,
    },
  });
});

export const changePasswordWithEmail = asyncHandler(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Alle Felder sind erforderlich." });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "Die Passwörter stimmen nicht überein." });
  }

  // Passwort-Sicherheitsüberprüfung (optional)
  const passwordStrengthRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
  if (!passwordStrengthRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Das Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Benutzer nicht gefunden." });
  }

  try {
    // Neues Passwort hashen
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Passwort aktualisieren und speichern
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Passwort erfolgreich geändert.",
    });
  } catch (error) {
    console.error("Fehler beim Ändern des Passworts:", error.message);
    res.status(500).json({ message: "Interner Serverfehler." });
  }
});

export const profilePhotoUpload = asyncHandler(async (req, res) => {
  const userId = req.userId; // Benutzer-ID aus dem Token
 
  if (!req.file) {
    return res.status(400).json({ message: "Keine Datei hochgeladen" });
  }

  const filePath = `${req.protocol}://${req.get(
    "host"
  )}/${req.file.path.replace(/\\/g, "/")}`;
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
  
    user.profile_photo = filePath;
    await user.save();

    // Aktualisierte Benutzerinformationen in der Antwort zurückgeben
    res.status(200).json({
      message: "Profilbild erfolgreich aktualisiert",
      userInfo: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profile_photo: user.profile_photo,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Fehler beim Hochladen des Profilbilds:", error.message);
    res.status(500).json({ message: "Interner Serverfehler" });
  }
});
