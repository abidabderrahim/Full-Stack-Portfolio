import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    fullName: { type: String, required: true, trim: true },
    job: { type: String, required: true, trim: true },
    message: { type: String, required: true, maxlength: 350 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who wrote
    replies: [
      {
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // only admins reply
        message: { type: String, required: true, maxlength: 350 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;