import express from "express";
import { uploadPost, uploadFroala, uploadProject, uploadTestimonial } from "../middleware/uploadMiddleware.js";
import { uploadPostImage, uploadFroalaImage, uploadProjectImage, uploadTestimonialImage } from "../controllers/uploadController.js";

const router = express.Router();

// Normal post image
router.post("/post", uploadPost.single("image"), uploadPostImage);

// Froala editor image
router.post("/froala", uploadFroala.single("file"), uploadFroalaImage);

// Normal project image
router.post("/project", uploadProject.single("image"), uploadProjectImage);

// Testimonial image
router.post("/testimonial", uploadTestimonial.single("image"), uploadTestimonialImage);


export default router;