import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Post from "../models/Post.js";
import Category from "../models/Category.js";
import Comment from "../models/Comment.js";
import File from "../models/File.js";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// ----------------- Helpers -----------------

// Delete file from filesystem and File collection
const deleteFileByUrl = async (fileUrl) => {
  if (!fileUrl) return;

  // Determine folder from URL
  let folder = "posts"; // default
  if (fileUrl.includes("/froala/")) folder = "froala";

  const filePath = path.join(process.cwd(), "uploads", folder, path.basename(fileUrl));

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }

  // Remove from File collection
  await File.findOneAndDelete({ url: fileUrl });
};

// Extract all image URLs from HTML content
const extractFroalaImages = (htmlContent) => {
  if (!htmlContent) return [];
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const urls = [];
  let match;
  while ((match = imgRegex.exec(htmlContent))) {
    urls.push(match[1]);
  }
  return urls;
};

// Delete Froala images no longer used in content
const deleteUnusedFroalaImages = async (oldContent, newContent, postId) => {
  const oldImages = extractFroalaImages(oldContent);
  const newImages = extractFroalaImages(newContent);
  const removed = oldImages.filter((img) => !newImages.includes(img));

  for (const imgUrl of removed) {
    await deleteFileByUrl(imgUrl);
  }

  // Remove removed images from File collection
  await File.deleteMany({ url: { $in: removed }, post: postId });
};

// ----------------- Controllers -----------------

export const createPost = async (req, res) => {
  try {
    const { title, description, category, image, content } = req.body;

    // Validation
    if (!title || title.trim().length < 3 || title.trim().length > 150)
      return res.status(400).json({ error: "Title must be 3-150 characters." });

    if (
      !description ||
      description.trim().length < 5 ||
      description.trim().length > 300
    )
      return res
        .status(400)
        .json({ error: "Description must be 5-300 characters." });

    if (!category)
      return res.status(400).json({ error: "Category is required." });
    if (!content || content.trim().length < 20)
      return res.status(400).json({ error: "Content is too short." });

    const existingCategory = await Category.findById(category);
    if (!existingCategory)
      return res.status(404).json({ error: "Category not found." });

    const cleanContent = DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true },
    });

    const post = await Post.create({
      title: title.trim(),
      description: description.trim(),
      category,
      image,
      content: cleanContent,
    });

    // Save main image in File collection
    if (image) {
      await File.create({
        filename: image.split("/").pop(),
        folder: "posts",
        url: image,
        post: post._id,
      });
    }

    // Save Froala images in File collection
    const froalaImages = extractFroalaImages(cleanContent);
    for (const imgUrl of froalaImages) {
      await File.create({
        filename: imgUrl.split("/").pop(),
        folder: "froala",
        url: imgUrl,
        post: post._id,
      });
    }

    res.status(201).json(post);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Server error while creating post." });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { title, description, category, image, content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found." });

    // Validation
    if (title && (title.trim().length < 3 || title.trim().length > 150))
      return res.status(400).json({ error: "Title must be 3-150 characters." });

    if (
      description &&
      (description.trim().length < 5 || description.trim().length > 300)
    )
      return res
        .status(400)
        .json({ error: "Description must be 5-300 characters." });

    if (content && content.trim().length < 20)
      return res.status(400).json({ error: "Content is too short." });

    // Category
    if (category) {
      const existingCategory = await Category.findById(category);
      if (!existingCategory)
        return res.status(404).json({ error: "Category not found." });
      post.category = category;
    }

    // Main image
    if (image && image !== post.image) {
      await deleteFileByUrl(post.image); // delete old image
      post.image = image;

      // Save new image in File collection
      await File.create({
        filename: image.split("/").pop(),
        folder: "posts",
        url: image,
        post: post._id,
      });
    }

    // Froala content
    if (content && content !== post.content) {
      const cleanContent = DOMPurify.sanitize(content, {
        USE_PROFILES: { html: true },
      });
      await deleteUnusedFroalaImages(post.content, content, post._id);
      post.content = cleanContent;

      // Save new Froala images
      const newImages = extractFroalaImages(cleanContent);
      for (const imgUrl of newImages) {
        const exists = await File.findOne({ url: imgUrl, post: post._id });
        if (!exists) {
          await File.create({
            filename: imgUrl.split("/").pop(),
            folder: "froala",
            url: imgUrl,
            post: post._id,
          });
        }
      }
    }

    if (title) post.title = title.trim();
    if (description) post.description = description.trim();

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: "Server error while updating post." });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Delete main image
    await deleteFileByUrl(post.image);

    // Delete all Froala images
    await deleteUnusedFroalaImages(post.content, "", post._id);

    // Delete all comments
    const result = await Comment.deleteMany({ post: post._id });

    res.status(200).json({
      message: "Post and its comments deleted successfully",
      deletedComments: result.deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Likes
export const togglePostLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) post.likes.pull(userId);
    else post.likes.push(userId);

    await post.save();
    res.json({ likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Views
export const addPostView = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    if (!post.views.includes(userId)) {
      post.views.push(userId);
      await post.save();
    }

    res.json({ views: post.views.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch posts
export const fetchPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("category")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get post by ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("category");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
