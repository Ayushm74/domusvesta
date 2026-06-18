import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is missing. Please log in again.",
      code: "AUTH_TOKEN_MISSING",
    });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "The authenticated user no longer exists. Please log in again.",
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Your session has expired. Please log in again.",
        code: "AUTH_TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid authentication token. Please log in again.",
        code: "AUTH_TOKEN_INVALID",
      });
    }

    console.error(error);
    return res.status(401).json({
      message: "Authentication failed. Please log in again.",
      code: "AUTH_FAILED",
    });
  }
};

