import mongoose from "mongoose";
import Testimonial from "./Testimonial.js";

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    techStack: { type: [String], default: [] },
    link: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

ProjectSchema.pre("remove", async function (next) {
  try {
    await Testimonial.deleteMany({ project: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Project", ProjectSchema);
