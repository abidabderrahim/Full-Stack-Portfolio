import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  folder: { type: String, required: true },
  url: { type: String, required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  testimonial: { type: mongoose.Schema.Types.ObjectId, ref: "Testimonial" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("File", fileSchema);