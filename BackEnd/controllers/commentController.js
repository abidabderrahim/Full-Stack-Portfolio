import Comment from "../models/Comment.js";

// Add comment (logged-in users or guest)
export const addComment = async (req, res) => {
  try {
    const { message, fullName, job } = req.body;

    if (!message || !fullName || !job) {
      return res
        .status(400)
        .json({ message: "Full Name, Job, and Message are required" });
    }

    const user = req.user; // optional, can be null for guest

    const newComment = await Comment.create({
      post: req.params.postId,
      user: user?._id, // logged-in user
      fullName,
      job,
      message,
      replies: [],
    });

    res.status(201).json(newComment);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch comments for a post
export const fetchComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .populate("user", "fullName email isAdmin") // who wrote the comment
      .populate("replies.admin", "fullName email isAdmin"); // admins who replied

    res.json(comments);
  } catch (err) {
    console.error("Fetch comments error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching comments" });
  }
};

// Admin reply
export const addReply = async (req, res) => {
  try {
    const { message } = req.body;
    const adminUser = req.user;

    if (!adminUser?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!message)
      return res.status(400).json({ message: "Message is required" });

    const comment = await Comment.findById(req.params.id);
    if (!comment)
      return res.status(404).json({ message: "Comment not found" });

    const reply = {
      admin: adminUser._id, // reference to admin
      message,
    };

    comment.replies.push(reply);
    await comment.save();

    // Populate admin info before sending
    const populatedComment = await comment.populate({
      path: "replies.admin",
      select: "fullName email isAdmin",
    });

    res.status(201).json(populatedComment.replies.slice(-1)[0]); // send only the new reply
  } catch (err) {
    console.error("Add reply error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

