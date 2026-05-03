import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken"; 
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { validateRegister, validateLogin, validateResetPassword } from "../middleware/validateUser.js";

const router = express.Router();

// Email auth
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);
router.get("/me", verifyToken, getMe);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

// Google OAuth
router.get("/google", (req, res, next) => {
  const { redirect } = req.query;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: encodeURIComponent(redirect || "/"),
  })(req, res, next);
});
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const isAdmin = req.user.email === process.env.ADMIN_USER;
    const token = jwt.sign({ id: req.user._id, isAdmin }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", maxAge: 7 * 24 * 60 * 60 * 1000 });
    if (isAdmin) {
      return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
    const redirect = req.query.state ? decodeURIComponent(req.query.state) : "/";
    res.redirect(`${process.env.CLIENT_URL}${redirect}`);
  }
);

export default router;