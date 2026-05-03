// controllers/projectController.js
import Project from "../models/Project.js";
import Category from "../models/Category.js";
import Testimonial from "../models/Testimonial.js";
import File from "../models/File.js";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// ----------------- Helpers -----------------

const deleteFileByUrl = async (fileUrl) => {
  if (!fileUrl) return;

  let folder = "projects"; // default main project images
  if (fileUrl.includes("/froala/")) folder = "froala";

  const filePath = path.join(
    process.cwd(),
    "uploads",
    folder,
    path.basename(fileUrl)
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }

  await File.findOneAndDelete({ url: fileUrl });
};

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

const deleteUnusedFroalaImages = async (oldContent, newContent, projectId) => {
  const oldImages = extractFroalaImages(oldContent);
  const newImages = extractFroalaImages(newContent);
  const removed = oldImages.filter((img) => !newImages.includes(img));

  for (const imgUrl of removed) {
    await deleteFileByUrl(imgUrl);
  }

  await File.deleteMany({ url: { $in: removed }, project: projectId });
};

export const createProject = async (req, res) => {
  try {
    const { title, description, content, image, category, techStack, link } =
      req.body;

    // --- Validation ---
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

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      content: cleanContent,
      image,
      category,
      techStack: Array.isArray(techStack) ? techStack : [],
      link: link ? link.trim() : null,
    });

    // Save main image
    if (image) {
      await File.create({
        filename: image.split("/").pop(),
        folder: "projects",
        url: image,
        project: project._id,
      });
    }

    // Save Froala images
    const froalaImages = extractFroalaImages(cleanContent);
    for (const imgUrl of froalaImages) {
      await File.create({
        filename: imgUrl.split("/").pop(),
        folder: "froala",
        url: imgUrl,
        project: project._id,
      });
    }

    res.status(201).json(project);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Server error while creating project." });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { title, description, content, image, category, techStack, link } =
      req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found." });

    // --- Validation ---
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

    if (category) {
      const existingCategory = await Category.findById(category);
      if (!existingCategory)
        return res.status(404).json({ error: "Category not found." });
      project.category = category;
    }

    // --- Main image ---
    if (image && image !== project.image) {
      await deleteFileByUrl(project.image);
      project.image = image;

      await File.create({
        filename: image.split("/").pop(),
        folder: "projects",
        url: image,
        project: project._id,
      });
    }

    // --- Froala content ---
    if (content && content !== project.content) {
      const cleanContent = DOMPurify.sanitize(content, {
        USE_PROFILES: { html: true },
      });
      await deleteUnusedFroalaImages(project.content, content, project._id);
      project.content = cleanContent;

      const newImages = extractFroalaImages(cleanContent);
      for (const imgUrl of newImages) {
        const exists = await File.findOne({
          url: imgUrl,
          project: project._id,
        });
        if (!exists) {
          await File.create({
            filename: imgUrl.split("/").pop(),
            folder: "froala",
            url: imgUrl,
            project: project._id,
          });
        }
      }
    }

    if (title) project.title = title.trim();
    if (description) project.description = description.trim();
    if (techStack) project.techStack = techStack;
    if (link) project.link = link.trim();

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: "Server error while updating project." });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Delete main image
    await deleteFileByUrl(project.image);

    // Delete all Froala images
    await deleteUnusedFroalaImages(project.content, "", project._id);

    // Delete all testimonials linked to this project
    const testimonialResult = await Testimonial.deleteMany({ project: id });

    res.status(200).json({
      message: "Project and its testimonials deleted successfully",
      deletedTestimonials: testimonialResult.deletedCount,
    });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Toggle like for Project
export const toggleProjectLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user.id;
    const alreadyLiked = project.likes.includes(userId);

    if (alreadyLiked) {
      // remove like
      project.likes.pull(userId);
    } else {
      // add like
      project.likes.push(userId);
    }

    await project.save();
    res.json({ likes: project.likes.length, liked: !alreadyLiked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add view for Project
export const addProjectView = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user.id;

    if (!project.views.includes(userId)) {
      project.views.push(userId);
      await project.save();
    }

    res.json({ views: project.views.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch all projects
export const fetchProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("category")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error("Fetch projects error:", err);
    res.status(500).json({ error: "Server error while fetching projects." });
  }
};

// Fetch related projects by category
export const getRelatedProjects = async (req, res) => {
  try {
    const { categoryId, currentProjectId } = req.params;

    const projects = await Project.find({
      category: categoryId,
      _id: { $ne: currentProjectId },
    })
      .limit(6) // optional: limit to 6 projects
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching related projects" });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("category");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ message: "Server error" });
  }
};
