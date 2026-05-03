import express from "express";
import {
  createPost,
  fetchPosts,
  getPostById,
  togglePostLike,
  addPostView,
  deletePost,
  updatePost,
} from "../controllers/postController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import Post from "../models/Post.js";
import Category from "../models/Category.js";

const router = express.Router();

router.route("/").get(fetchPosts).post(createPost);

// Get related posts by category — put this BEFORE the '/:id' route
router.get("/category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const exclude = req.query.exclude;

    let query = { category: id }; // ✅ use category not category._id
    if (exclude) query._id = { $ne: exclude };

    const posts = await Post.find(query).limit(6).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Related posts error:", err);
    res.status(500).json({ message: "Failed to fetch related posts" });
  }
});

router.route("/:id").get(getPostById).put(updatePost).delete(deletePost);

router.post("/:id/like", verifyToken, togglePostLike);
router.post("/:id/view", verifyToken, addPostView);

export default router;
