import express from "express";
import User from "../models/User.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/users → Fetch all users (admin only)
router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({
      email: { $ne: process.env.ADMIN_USER } // exclude admin
    })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ fullName: 1 });

    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// DELETE /api/users/:id → Delete a user (admin only)
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.email === process.env.ADMIN_USER) {
      return res.status(403).json({ message: "Cannot delete admin user" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error deleting user" });
  }
});


export default router;