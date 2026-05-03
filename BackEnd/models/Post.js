import mongoose from "mongoose";
import Comment from "./Comment.js";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    image: { type: String, required: true },
    content: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

postSchema.pre("remove", async function (next) {
  try {
    await Comment.deleteMany({ post: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

const Post = mongoose.model("Post", postSchema);
export default Post;
