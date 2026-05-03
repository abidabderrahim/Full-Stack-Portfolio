import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Helper to build file URL
const getFileUrl = (folder, filename) => `/uploads/${folder}/${filename}`;

// Ensure upload folders exist
const ensureFolderExists = (folder) => {
  const uploadPath = path.join(process.cwd(), "uploads", folder);
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
  return uploadPath;
};

// Upload normal post image
export const uploadPostImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  // Generate safe unique filename
  const ext = path.extname(req.file.originalname);
  const filename = `${uuidv4()}${ext}`;

  const folder = "posts";
  const uploadPath = ensureFolderExists(folder);

  // Move file to correct folder
  fs.renameSync(req.file.path, path.join(uploadPath, filename));

  res.status(200).json({ url: getFileUrl(folder, filename) });
};

// Upload Froala editor image
export const uploadFroalaImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  const ext = path.extname(req.file.originalname);
  const filename = `${uuidv4()}${ext}`;

  const folder = "froala";
  const uploadPath = ensureFolderExists(folder);
  fs.renameSync(req.file.path, path.join(uploadPath, filename));

  // Froala expects 'link' instead of 'url'
  res.status(200).json({ link: getFileUrl(folder, filename) });
};

// Upload Project image
export const uploadProjectImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  const ext = path.extname(req.file.originalname);
  const filename = `${uuidv4()}${ext}`;

  const folder = "projects";
  const uploadPath = ensureFolderExists(folder);
  fs.renameSync(req.file.path, path.join(uploadPath, filename));

  res.status(200).json({ url: getFileUrl(folder, filename) });
};

// Upload Testimonial image
export const uploadTestimonialImage = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  const ext = path.extname(req.file.originalname);
  const filename = `${uuidv4()}${ext}`;

  const folder = "testimonials";
  const uploadPath = ensureFolderExists(folder);

  fs.renameSync(req.file.path, path.join(uploadPath, filename));

  res.status(200).json({ url: getFileUrl(folder, filename) });
};