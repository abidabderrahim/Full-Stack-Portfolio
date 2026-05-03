import express from "express";
import {
  addTestimonial,
  getTestimonials,
  addReplyToTestimonial,
} from "../controllers/testimonialController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import Testimonial from "../models/Testimonial.js";
import File from "../models/File.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// Add testimonial (user only)
router.post("/:projectId", verifyToken, addTestimonial);

// Get testimonials for a project
router.get("/:projectId", getTestimonials);

// Admin reply to testimonial
router.post("/:testimonialId/reply", verifyToken, isAdmin, addReplyToTestimonial);

// Optional: fetch all user testimonials
router.get("/users/all", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ user: { $exists: true } })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user testimonials", error: err.message });
  }
});

// ---------------- Delete testimonial with image ----------------
const deleteFileByUrl = async (fileUrl) => {
  if (!fileUrl) return;

  const filePath = path.join(process.cwd(), "uploads", "testimonials", path.basename(fileUrl));

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted testimonial file: ${filePath}`);
  } else {
    console.log(`Testimonial file not found: ${filePath}`);
  }

  // Remove from File collection
  await File.findOneAndDelete({ url: fileUrl });
};

// Delete a testimonial (admin only)
router.delete("/:testimonialId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const deleted = await Testimonial.findByIdAndDelete(testimonialId);
    if (!deleted) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    // Delete profile image if exists
    if (deleted.image) {
      await deleteFileByUrl(deleted.image);
    }
    
    res.json({ message: "Testimonial deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete testimonial", error: err.message });
  }
});

export default router;
