import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, maxlength: 350 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const testimonialSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    image: { type: String, default: "" }, // uploaded testimonial image
    nameclient: { type: String, required: true, trim: true },
    jobclient: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 350 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional if logged-in client
    replies: [replySchema], // admins reply only
  },
  { timestamps: true }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);
export default Testimonial;