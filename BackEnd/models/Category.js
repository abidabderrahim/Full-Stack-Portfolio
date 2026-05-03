import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["post", "project"], required: true },
});

categorySchema.index({ name: 1, type: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);
export default Category;
