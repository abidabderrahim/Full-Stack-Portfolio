import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Welcome Admin! This is your dashboard." });
});

export default router;