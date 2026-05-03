import React, { useState, useEffect, useRef } from "react";
import {
  createPost,
  fetchPostCategories,
  createPostCategory,
  uploadPostImage,
  uploadFroalaImage,
  updatePost,
} from "../../services/api";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { marked } from "marked";
import MDEditor, { commands } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import styles from "./Modals.module.css";

const PostModal = ({ isOpen, onClose, editingPost }) => {
  const editorRef = useRef(null);

  // State hooks
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [optionOpen, setOptionOpen] = useState(false);
  const [error, setError] = useState("");
  const [isConverted, setIsConverted] = useState(false); // new

  // Helper to show error
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPostCategories()
        .then((res) => setCategories(res.data))
        .catch(() => showError("Failed to load categories"));
    }
  }, [isOpen]);

  // Load editing post data
  useEffect(() => {
    if (editingPost) {
      const turndownService = new TurndownService();
      setTitle(editingPost.title || "");
      setDescription(editingPost.description || "");
      // Convert saved HTML back to Markdown
      setContent(turndownService.turndown(editingPost.content || ""));
      setImage(editingPost.image || "");
      setSelectedCategory(editingPost.category || null);
    } else {
      setTitle("");
      setDescription("");
      setContent("");
      setImage("");
      setSelectedCategory(null);
    }
  }, [editingPost]);

  // Early return if modal is closed
  if (!isOpen) return null;

  // Image upload
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
      const res = await uploadPostImage(file);
      setImage(`${import.meta.env.VITE_API_URL}${res.data.url}`);
    } catch {
      showError("Image upload failed");
    }
  };

  // Form validation
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

  // Add new category
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
      const res = await createPostCategory(name);
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

  // Submit post
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return showError(validationError);

    try {
      let finalCategoryId =
        selectedCategory?._id || selectedCategory?.id || null;

      if (!finalCategoryId && newCategory.trim()) {
        const res = await createPostCategory(newCategory.trim());
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

      if (editingPost) {
        await updatePost(editingPost._id, {
          image: image.trim(),
          title: title.trim(),
          description: description.trim(),
          category: finalCategoryId,
          content: finalContent,
        });
      } else {
        await createPost({
          image: image.trim(),
          title: title.trim(),
          description: description.trim(),
          category: finalCategoryId,
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
      setIsConverted(false);
    } catch (err) {
      showError(err.response?.data?.error || "Error saving post");
    }
  };

  return (
    <div className={styles.postModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              {editingPost ? "Update Blog Post" : "Create Blog Post"}
            </h2>
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
              placeholder="Post Title"
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
              {editingPost ? "Update Post" : "Create Post"}
              <i className="ri-edit-line"></i>{" "}
            </button>
          </form>
          {error && <div className={styles.messageError}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default PostModal;
