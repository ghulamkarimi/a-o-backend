import asyncHandler from "express-async-handler";
import User from "../models/userModel.js"
import jwt from "jsonwebtoken";



export const refreshToken = asyncHandler(async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: "Access token not provided" });
    }

    // Benutzer anhand des Tokens suchen
    const user = await User.findOne({ access_token: token });
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    console.log("user",user)

    // Token verifizieren
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err || user.firstName !== decoded.firstName) {
        return res.status(403).json({ message: "Access token verification failed" });
      }

      // Neues Refresh-Token generieren
      const refreshToken = jwt.sign(
        {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isAdmin: user.isAdmin,
          profile_photo: user.profile_photo,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "30m" } // Refresh-Token für 30 Minuten gültig
      );

      // Antwort mit dem neuen Refresh-Token
      res.status(200).json({ refreshToken });
    });
  } catch (error) {
    console.error("Error in refreshToken:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
