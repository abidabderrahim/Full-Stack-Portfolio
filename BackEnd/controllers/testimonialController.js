import Testimonial from "../models/Testimonial.js";
import File from "../models/File.js";
import path from "path";
import fs from "fs";

// Add testimonial (user only, one per project)
export const addTestimonial = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { image, nameclient, jobclient, description } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "You must be logged in to add a testimonial." });
    }

    if (user.isAdmin) {
      return res.status(403).json({ message: "Admins cannot add testimonials." });
    }

    // Check if user already added testimonial for this project
    const existing = await Testimonial.findOne({ project: projectId, user: user.id });
    if (existing) {
      return res.status(400).json({ message: "You have already added a testimonial for this project." });
    }

    // Create testimonial
    const testimonial = await Testimonial.create({
      project: projectId,
      image,
      nameclient,
      jobclient,
      description,
      user: user.id,
      replies: [],
    });

    // Save testimonial image in File collection if exists
    if (image) {
      await File.create({
        filename: path.basename(image),
        folder: "testimonials",
        url: image,
        testimonial: testimonial._id, // link image to testimonial
      });
    }

    res.status(201).json(testimonial);
  } catch (err) {
    console.error("Add testimonial error:", err);
    res.status(500).json({ message: "Failed to add testimonial", error: err.message });
  }
};

// Get all testimonials for a project
export const getTestimonials = async (req, res) => {
  try {
    const { projectId } = req.params;
    const testimonials = await Testimonial.find({ project: projectId })
      .populate("user", "fullName email")
      .populate("replies.admin", "fullName email isAdmin")
      .sort({ createdAt: -1 });

    res.json(testimonials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch testimonials", error: err.message });
  }
};

// Admin reply to testimonial
export const addReplyToTestimonial = async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const { message } = req.body;

    const user = req.user;
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Only admins can reply to testimonials." });
    }

    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) return res.status(404).json({ message: "Testimonial not found" });

    testimonial.replies.push({
      admin: user.id,
      message,
    });

    await testimonial.save();
    res.json(testimonial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reply", error: err.message });
  }
};