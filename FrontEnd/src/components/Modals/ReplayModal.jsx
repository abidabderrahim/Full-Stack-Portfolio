import React, { useState, useEffect } from "react";
import styles from "./Modals.module.css";

const ReplayModal = ({ isOpen, onClose, onSubmit }) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!message.trim()) {
      setError("Reply cannot be empty");
      setTimeout(() => setError(""), 3000);
      return;
    }

    onSubmit(message.trim());
    setMessage(""); // reset after submit
    onClose();
  };

  return (
    <div className={styles.ReplayModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <div className={styles.header}>
            <h3 className={styles.modalTitle}>Write a Reply</h3>
            <button className={styles.closeBtn} onClick={onClose}>
              <i className="ri-close-large-line"></i>
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply here..."
            rows={5}
            maxLength={200}
            className={styles.replyInput}
          />

          {/* Character count */}
          <div className={styles.charCount}>{message.length} / 200</div>

          <button onClick={handleSubmit} className={styles.submitBtn}>
            <i className="ri-reply-fill"></i> Send Reply
          </button>

          {error && <div className={styles.messageError}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ReplayModal;
