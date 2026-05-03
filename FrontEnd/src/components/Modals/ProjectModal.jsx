import React, { useState, useEffect, useRef } from "react";
import {
  createProject,
  updateProject,
  fetchProjectCategories,
  createProjectCategory,
  uploadProjectImage,
  uploadFroalaImage,
} from "../../services/api";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { marked } from "marked";
import MDEditor, { commands } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import styles from "./Modals.module.css";

const ProjectModal = ({ isOpen, onClose, editingProject }) => {
  const editorRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [optionOpen, setOptionOpen] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState([]);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [isConverted, setIsConverted] = useState(false); // new

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProjectCategories()
        .then((res) => setCategories(res.data))
        .catch(() => showError("Failed to load categories"));
    }
  }, [isOpen]);

  // Populate form if editing
  // Populate form if editing (like PostModal)
  useEffect(() => {
    if (editingProject) {
      const turndownService = new TurndownService();
      setTitle(editingProject.title || "");
      setDescription(editingProject.description || "");
      // Convert saved HTML content back to Markdown
      setContent(turndownService.turndown(editingProject.content || ""));
      setImage(editingProject.image || "");
      setPreview(editingProject.image || "");
      setTechStack(editingProject.techStack || []);
      setLink(editingProject.link || "");
      setSelectedCategory(editingProject.category || null);
    } else {
      // Reset form
      setTitle("");
      setDescription("");
      setContent("");
      setImage("");
      setPreview("");
      setTechStack([]);
      setLink("");
      setSelectedCategory(null);
      setNewCategory("");
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type))
      return showError("Only JPG, PNG, GIF allowed");
    if (file.size > 5 * 1024 * 1024)
      return showError("Image must be smaller than 5MB");

    setPreview(URL.createObjectURL(file));

    try {
      const res = await uploadProjectImage(file);
      setImage(`${import.meta.env.VITE_API_URL}${res.data.url}`);
    } catch {
      showError("Image upload failed");
    }
  };

  const validateForm = () => {
    if (!image || !image.trim()) return "Image is required";
    if (!title.trim()) return "Title is required";
    if (!description.trim()) return "Description is required";
    if (!content.trim()) return "Content cannot be empty";
    if (!selectedCategory && !newCategory.trim()) return "Category is required";
    if (
      newCategory.trim() &&
      (newCategory.length < 2 || newCategory.length > 50)
    )
      return "Category must be between 2 and 50 characters";
    return null;
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return showError("Enter a category name");
    if (name.length < 2 || name.length > 50)
      return showError("Category must be between 2 and 50 characters");

    const exists = categories.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) return showError("Category already exists");

    try {
      const res = await createProjectCategory(name);
      setCategories([...categories, res.data]);
      setSelectedCategory(res.data);
      setNewCategory("");
    } catch (err) {
      showError(err.response?.data?.error || "Failed to add category");
    }
  };

  // Custom command for image upload inside Markdown editor
  const uploadImageCommand = {
    name: "upload-image",
    keyCommand: "upload-image",
    buttonProps: { "aria-label": "Upload Image" },
    icon: <i className="ri-image-add-line"></i>,
    execute: async (state, api) => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.onchange = async () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        try {
          const res = await uploadFroalaImage(file);
          const imageUrl = `${import.meta.env.VITE_API_URL}${
            res.data.url || res.data.link
          }`;
          const imageMarkdown = `![${file.name}](${imageUrl})`;
          api.replaceSelection(imageMarkdown);
        } catch (err) {
          console.error("Image upload failed", err);
          alert("Image upload failed");
        }
      };

      fileInput.click();
    },
  };

  // --- New: Handler for "Convert to HTML" ---
  const handleConvertToHtml = () => {
    try {
      const html = marked.parse(content || "");
      // Option A: show preview (maybe set state)
      // Option B: Replace content with HTML (if you want content saved as HTML)
      setContent(html);
      setIsConverted(true);
    } catch (err) {
      console.error("Conversion failed", err);
      showError("Failed to convert to HTML");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return showError(validationError);

    try {
      let finalCategoryId =
        selectedCategory?._id || selectedCategory?.id || null;

      if (!finalCategoryId && newCategory.trim()) {
        const res = await createProjectCategory(newCategory.trim());
        finalCategoryId = res.data._id || res.data.id;
        setCategories([...categories, res.data]);
        setSelectedCategory(res.data);
        setNewCategory("");
      }

      if (!finalCategoryId) return showError("Category not set");

      // If content is markdown (not yet converted), convert to HTML
      let htmlContent;
      if (isConverted) {
        htmlContent = content;
      } else {
        htmlContent = DOMPurify.sanitize(marked.parse(content || ""));
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.querySelectorAll("img").forEach((img) => {
        if (!img.src) img.remove();
      });
      const finalContent = tempDiv.innerHTML;

      if (editingProject) {
        // Update existing project
        await updateProject(editingProject._id, {
          image: image.trim(),
          title: title.trim(),
          description: description.trim(),
          category: finalCategoryId,
          techStack,
          link,
          content: finalContent,
        });
      } else {
        // Create new project
        await createProject({
          image: image.trim(),
          title: title.trim(),
          description: description.trim(),
          category: finalCategoryId,
          techStack,
          link,
          content: finalContent,
        });
      }

      onClose();

      // Reset form
      setTitle("");
      setDescription("");
      setContent("");
      setImage("");
      setPreview("");
      setNewCategory("");
      setSelectedCategory(null);
      setLink("");
      setTechStack([]);
      setIsConverted(false);
    } catch (err) {
      showError(err.response?.data?.error || "Error saving project");
    }
  };

  return (
    <div className={styles.ProjectModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <div className={styles.header}>
            <h2 className={styles.title}>Create Project</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <i className="ri-close-large-line"></i>
            </button>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Image Upload */}
            <label className={styles.uploadContainer}>
              {image ? (
                <img
                  src={preview || image}
                  alt="uploaded"
                  className={styles.uploadedImage}
                />
              ) : (
                <i className="ri-upload-2-fill"></i>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.uploadInput}
              />
            </label>

            {/* Title */}
            <input
              type="text"
              value={title}
              placeholder="Project Title"
              onChange={(e) => setTitle(e.target.value)}
              className={styles.titleInput}
            />

            {/* Description */}
            <textarea
              rows="3"
              value={description}
              maxLength={200}
              placeholder="Short description"
              onChange={(e) => setDescription(e.target.value)}
              className={styles.descInput}
            />

            {/* New Category */}
            <div className={styles.newCategory}>
              <input
                type="text"
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className={styles.categoryInput}
              />
              <button
                type="button"
                className={styles.addCategoryBtn}
                onClick={handleAddCategory}
              >
                + Add
              </button>
            </div>

            {/* Existing Category Dropdown */}
            <div
              className={`${styles.customSelect} ${
                optionOpen ? styles.open : ""
              }`}
            >
              <div
                className={styles.selected}
                onClick={() => setOptionOpen(!optionOpen)}
              >
                {selectedCategory?.name || "Select existing category"}
                <i className="ri-arrow-down-s-line"></i>
              </div>
              <div className={styles.options}>
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className={`${styles.option} ${
                      selectedCategory?._id === cat._id ? styles.active : ""
                    }`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setOptionOpen(false);
                    }}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className={styles.techStack}>
              <div className={styles.addStack}>
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="Enter a tool (e.g., React, Node.js)"
                  className={styles.toolInput}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (
                      techInput.trim() &&
                      !techStack.includes(techInput.trim())
                    ) {
                      setTechStack([...techStack, techInput.trim()]);
                      setTechInput("");
                    }
                  }}
                  className={styles.addTool}
                >
                  Add
                </button>
              </div>

              <div className={styles.tools}>
                {techStack.map((tool, idx) => (
                  <span key={idx} className={styles.tool}>
                    {tool}
                    <button
                      type="button"
                      className={styles.removeTool}
                      onClick={() =>
                        setTechStack(techStack.filter((t) => t !== tool))
                      }
                    >
                      <i className="ri-close-large-line"></i>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Project Link */}
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/username/project"
              className={styles.projectLink}
            />

            {/* Markdown Editor */}
            <div className={styles.editor} data-color-mode="light">
              <MDEditor
                value={content}
                onChange={setContent}
                height={400}
                commands={[
                  commands.bold,
                  commands.italic,
                  commands.strikethrough,
                  commands.divider,
                  commands.title,
                  commands.link,
                  commands.quote,
                  commands.unorderedListCommand,
                  commands.orderedListCommand,
                  commands.code,
                  commands.codeBlock,
                  uploadImageCommand,
                  commands.divider,
                  commands.fullscreen,
                ]}
                textareaProps={{
                  placeholder: "Write your article in Markdown...",
                }}
              />
            </div>

            {/* Button for Convert */}
            <button
              type="button"
              onClick={handleConvertToHtml}
              className={styles.converttohtmlBtn}
            >
              Convert to HTML <i class="ri-code-s-slash-line"></i>
            </button>

            <button type="submit" className={styles.submitBtn}>
              {editingProject ? "Update Project" : "Create Project"}
              <i
                className={editingProject ? "ri-edit-line" : "ri-add-fill"}
              ></i>{" "}
            </button>
          </form>
          {error && <div className={styles.messageError}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
