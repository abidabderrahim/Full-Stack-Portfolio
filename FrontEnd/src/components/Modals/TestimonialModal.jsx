// src/components/Modals/TestimonialModal.jsx
import React, { useState, useEffect } from "react";
import {
  uploadTestimonialImage,
  addTestimonial,
  fetchTestimonialsByProject,
} from "../../services/api";
import styles from "./Modals.module.css";

const TestimonialModal = ({
  isOpen,
  onClose,
  projectId,
  setTestimonials,
  user,
}) => {
  const [nameclient, setNameClient] = useState("");
  const [jobclient, setJobClient] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Check if user already submitted a testimonial
  useEffect(() => {
    const checkAlreadySubmitted = async () => {
      if (!user) return;
      try {
        const testimonials = await fetchTestimonialsByProject(projectId);
        const hasSubmitted = testimonials.some((t) => t.user?._id === user._id);
        setAlreadySubmitted(hasSubmitted);
      } catch (err) {
        console.error("Failed to check testimonials:", err);
      }
    };
    checkAlreadySubmitted();
  }, [user, projectId]);

  if (!isOpen) return null;

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  // Handle image selection and upload
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
      const res = await uploadTestimonialImage(file);
      if (!res?.data?.url) throw new Error("No URL returned");
      setImage(`${import.meta.env.VITE_API_URL}${res.data.url}`);
    } catch (err) {
      console.error("Image upload failed:", err);
      showError("Image upload failed");
    }
  };

  const validateForm = () => {
    if (!image || !image.trim()) return "Image is required";
    if (!nameclient.trim()) return "Name is required";
    if (!jobclient.trim()) return "Job is required";
    if (!description.trim()) return "Description is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) return showError("You must be logged in to add a testimonial");
    if (alreadySubmitted)
      return showError("You have already added a testimonial for this project");

    const validationError = validateForm();
    if (validationError) return showError(validationError);

    setLoading(true);
    try {
      const data = { nameclient, jobclient, description, image };
      const res = await addTestimonial(projectId, data);

      // Update parent testimonial list
      if (setTestimonials) setTestimonials(res);

      // Reset form
      setNameClient("");
      setJobClient("");
      setDescription("");
      setImage("");
      setPreview("");
      setAlreadySubmitted(true);
      onClose();
    } catch (err) {
      console.error("Add testimonial error:", err);
      showError(err.response?.data?.error || "Failed to add testimonial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.testimonialModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <div className={styles.header}>
            <h2 className={styles.title}>Create Testimonial Post</h2>
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

            {/* Name */}
            <input
              type="text"
              value={nameclient}
              placeholder="Client Name"
              onChange={(e) => setNameClient(e.target.value)}
              className={styles.titleInput}
            />

            {/* Job */}
            <input
              type="text"
              value={jobclient}
              placeholder="Client Job"
              onChange={(e) => setJobClient(e.target.value)}
              className={styles.jobInput}
            />

            {/* Description */}
            <textarea
              rows="3"
              value={description}
              maxLength={200}
              placeholder="Testimonial Description"
              onChange={(e) => setDescription(e.target.value)}
              className={styles.descInput}
            />
            <p className={styles.charCount}>{description.length} / 200</p>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || alreadySubmitted}
            >
              {loading ? (
                "Adding..."
              ) : (
                <>
                  <i className="ri-add-fill"></i> Add Testimonial
                </>
              )}
            </button>
          </form>
          {error && <div className={styles.messageError}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default TestimonialModal;
