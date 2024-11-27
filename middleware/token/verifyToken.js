import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  console.log("Cookies im Request:", req.cookies);
  console.log("Authorization-Header:", req.headers.authorization);

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Unauthorized Access" });
    }

    req.userId = decoded.userId; // Benutzer-ID aus dem Token speichern
    next();
  });
};
