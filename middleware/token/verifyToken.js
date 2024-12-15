import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  console.log("Cookies in Request:", req.cookies);

  let token = req.headers.authorization?.split(" ")[1];

  if (!token && req.cookies?.refreshToken) {
    console.log("No access token found. Using refresh token.");

    const refreshToken = req.cookies.refreshToken;

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
      if (err) {
        console.error("Refresh token verification failed:", err.message);
        return res.status(403).json({ message: "Invalid or expired refresh token" });
      }

      const newAccessToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email },
        process.env.ACCESS_TOKEN,
        { expiresIn: "15m" }
      );

      req.newAccessToken = newAccessToken;
      req.userId = decoded.userId;

      res.setHeader("Authorization", `Bearer ${newAccessToken}`);
      return next();
    });

    return;
  }

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      console.error("Access token verification failed:", err.message);
      return res.status(403).json({ message: "Invalid or expired access token" });
    }

    req.userId = decoded.userId;
    next();
  });
};
