import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  console.log("Cookies im Request:", req.cookies);
  console.log("Authorization-Header:", req.headers.authorization);

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken; // Token aus Cookies
  }

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      console.error("Token-Verifizierungsfehler:", err.message);
      return res.status(403).json({
        message: err.name === "TokenExpiredError"
          ? "Token abgelaufen"
          : "Ungültiges Token",
      });
    }

    req.userId = decoded.userId; // Benutzer-ID aus dem Token speichern
    console.log("Token-Dekodiert:", decoded); // Debugging-Log
    next();
  });
};
