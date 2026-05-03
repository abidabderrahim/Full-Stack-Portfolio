import React, { useState } from "react";
import api from "../../services/api";
import styles from "./Modals.module.css";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return showError("Enter a valid email");

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      showError(err.response?.data?.message || "Error sending reset link");
    }
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000); // auto-hide after 3s
  };

  return (
    <div className={styles.ForgotPasswordModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <h2 className={styles.title}>Forgot Password</h2>
          {!sent ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
              />
              <button type="submit" className={styles.submitBtn}>
                Send Reset Link
              </button>
            </form>
          ) : (
            <span className={styles.successMessage}>
              Reset link sent! Please check your email.
            </span>
          )}
          {error && <div className={styles.messageError}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
