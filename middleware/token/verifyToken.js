import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ message: "Access Denied" });
  }

  const token = authorizationHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  jwt.verify(token, process.env.REFRESH_TOKEN, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Unauthorized Access" });
    }

    req.userId = user.userId; // Ensure this has the user ID or necessary info
    next();
  });
};
