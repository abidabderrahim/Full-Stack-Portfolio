// routes/contact.js
import express from "express";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendEmail.js";
import { verifyToken } from "../middleware/authMiddleware.js";

dotenv.config();

const router = express.Router();

// ONLY LOGGED-IN USERS CAN SEND MESSAGE
router.post("/", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const fullName = user.fullName;
    const email = user.email;

    const html = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `;

    await sendEmail(
      process.env.EMAIL_USER,
      "PortfolioHub - New Message",
      html
    );

    return res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("Contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
});

export default router;