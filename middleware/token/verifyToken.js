import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  console.log("Cookies im Request:", req.cookies);
  console.log("Authorization-Header:", req.headers.authorization);

  let token;

  // Access Token zuerst prüfen
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Fallback: Refresh Token prüfen
  if (!token && req.cookies && req.cookies.refreshToken) {
    console.log("Kein Access Token gefunden. Verwende Refresh Token.");
    const refreshToken = req.cookies.refreshToken;

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
      if (err) {
        console.error("Fehler bei der Refresh-Token-Verifizierung:", err.message);
        return res.status(403).json({
          message: err.name === "TokenExpiredError"
            ? "Refresh Token abgelaufen"
            : "Ungültiges Refresh Token",
        });
      }

      // Neuen Access Token erstellen
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email },
        process.env.ACCESS_TOKEN,
        { expiresIn: "15m" }
      );
      console.log("Neuer Access Token erstellt:", newAccessToken);

      // Access Token im Request-Objekt speichern
      req.newAccessToken = newAccessToken;
      req.userId = decoded.userId;

      return next(); // Weiter zum nächsten Handler
    });

    return; // Sicherstellen, dass nichts nach der Token-Erstellung ausgeführt wird
  }

  // Token verifizieren (Access Token)
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      console.error("Token-Verifizierungsfehler:", err.message);
      return res.status(403).json({
        message: err.name === "TokenExpiredError"
          ? "Access Token abgelaufen"
          : "Ungültiges Token",
      });
    }

    req.userId = decoded.userId;
    console.log("Token-Dekodiert:", decoded); // Debugging
    next();
  });
};
