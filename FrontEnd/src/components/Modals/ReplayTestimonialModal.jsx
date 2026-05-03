// src/components/Modals/ReplayTestimonialModal.jsx
import React, { useEffect, useState } from "react";
import styles from "./Modals.module.css";
import { addReplyTestimonial } from "../../services/api";

const ReplayTestimonialModal = ({
  isOpen,
  onClose,
  testimonialId,
  onSuccess,
}) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Reply message is required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const reply = await addReplyTestimonial(testimonialId, message.trim());
      onSuccess(); // update parent UI
      onClose();
      setMessage("");
    } catch (err) {
      console.error("Add reply error:", err);
      setError("Failed to add reply");
    }
  };

  return (
    <div className={styles.replaytestimonialModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <div className={styles.header}>
            <h2 className={styles.title}>Reply to Testimonial</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <i className="ri-close-large-line"></i>
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <textarea
              rows="5"
              value={message}
              placeholder="Type your reply..."
              onChange={(e) => setMessage(e.target.value)}
              className={styles.replayInput}
              maxLength={200}
            />

            {/* Character count */}
            <div className={styles.charCount}>{message.length} / 200</div>

            <button type="submit" className={styles.submitBtn}>
              <i className="ri-reply-fill"></i> Reply
            </button>

            {error && <div className={styles.messageError}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReplayTestimonialModal;
