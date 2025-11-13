import jwt from "jsonwebtoken";
import User from "../models/user.models.js";


const auth = (req, res, next) => {
  try {
    // 1️⃣ Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    // 3️⃣ Attach decoded user to request - Readable data so use the decode
    req.user = decoded;

    // 4️⃣ Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error("❌ JWT verification error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    res.status(401).json({
      success: false,
      message: "Invalid token. Access denied.",
    });
  }
};

export default auth;
