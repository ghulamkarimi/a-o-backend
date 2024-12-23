import jwt from "jsonwebtoken";

export const verifyToken = (
  req,
  res,
  next
) => {
  const authHeader = req.headers?.authorization;
  console.log("authHeader: ",authHeader)

    const token = authHeader && authHeader.toString().split(" ")[1];
    if (!token) throw new Error("Token not provided");
    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err || !decoded || typeof decoded !== "object")
          throw new Error("Token verification failed");
        req.userId = (decoded).userId;
        next();
      }
    );
  } 
