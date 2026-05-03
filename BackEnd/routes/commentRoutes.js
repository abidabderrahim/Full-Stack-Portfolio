import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { addComment, fetchComments, addReply } from "../controllers/commentController.js";

const router = express.Router();

router.post("/:postId", verifyToken, addComment);
router.get("/:postId", fetchComments);
router.post("/:id/reply", verifyToken, isAdmin, addReply);

export default router;