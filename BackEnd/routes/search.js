import express from "express";
import Post from "../models/Post.js";

const router = express.Router();

// GET /api/posts/search?query=keyword
router.get("/", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query is required", data: [] });
    }

    const regex = new RegExp(query.trim(), "i"); // case-insensitive search
    const posts = await Post.find({
      $or: [{ title: regex }, { description: regex }],
    }).limit(10); // limit suggestions

    res.json({ data: posts });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error", data: [] });
  }
});

export default router;