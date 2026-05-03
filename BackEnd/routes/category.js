import express from "express";
import Category from "../models/Category.js";
import Post from "../models/Post.js";

const router = express.Router();

// GET /api/categories/posts
router.get("/posts", async (req, res) => {
  try {
    // Find only categories with type "post"
    const categories = await Category.find({ type: "post" });

    // Filter out categories with no posts
    const categoriesWithPosts = [];
    for (const cat of categories) {
      const count = await Post.countDocuments({ category: cat._id });
      if (count > 0) {
        categoriesWithPosts.push({
          _id: cat._id,
          name: cat.name,
          count,
        });
      }
    }

    res.json({ data: categoriesWithPosts });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;