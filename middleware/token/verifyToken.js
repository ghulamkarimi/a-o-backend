import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const refreshToken = req.cookies?.refreshToken;

  if (!token && !refreshToken) {
    console.error("[TOKEN-VERIFY] Weder Access-Token noch Refresh-Token gefunden.");
    return res.status(401).json({ message: "Zugriff verweigert" });
  }

  if (!token && refreshToken) {
    console.log("[TOKEN-VERIFY] Kein Access-Token gefunden. Verwende Refresh-Token...");

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.error("[TOKEN-VERIFY] Fehler bei der Verifizierung des Refresh-Tokens:", err.message);
        return res.status(403).json({
          message: err.name === "TokenExpiredError" ? "Refresh-Token abgelaufen" : "Ungültiger Refresh-Token",
        });
      }

      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      console.log(`[TOKEN-VERIFY] Neues Access-Token erstellt: ${newAccessToken}`);

      // Setze neues Access-Token in Cookies
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 Minuten
      });

      // Optional: Rückgabe im Response-Body
      res.setHeader("Authorization", `Bearer ${newAccessToken}`);
      req.userId = decoded.userId;
      req.newAccessToken = newAccessToken;

      return next();
    });

    return;
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error("[TOKEN-VERIFY] Access-Token-Verifizierung fehlgeschlagen:", err.message);
      return res.status(403).json({
        message: err.name === "TokenExpiredError" ? "Access-Token abgelaufen" : "Ungültiges Access-Token",
      });
    }

    console.log(`[TOKEN-VERIFY] Access-Token erfolgreich verifiziert: User ID ${decoded.userId}`);
    req.userId = decoded.userId;
    next();
  });
};
