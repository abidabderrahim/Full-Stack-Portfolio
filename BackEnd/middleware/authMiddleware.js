import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIX: get full user from database
    const user = await User.findById(decoded.id).select(
      "fullName email isAdmin"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // now contains fullName + email + isAdmin
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};