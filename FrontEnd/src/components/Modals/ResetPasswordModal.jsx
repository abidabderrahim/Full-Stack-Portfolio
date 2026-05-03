import React, { useState } from "react";
import api from "../../services/api";
import styles from "./Modals.module.css";

const ResetPasswordModal = ({ isOpen, onClose, tokenData }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return showError("Passwords do not match");
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return showError("Password too weak");
    }

    try {
      await api.post("/auth/reset-password", {
        email: tokenData.email,
        token: tokenData.token,
        newPassword: password,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.dispatchEvent(new CustomEvent("openLoginModal"));
      }, 2000);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to reset password");
    }
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000); // auto-hide after 3s
  };

  return (
    <div className={styles.ResetPasswordModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <h2 className={styles.title}>Reset Password</h2>
          {!success ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
              />
              <button type="submit" className={styles.submitBtn}>
                Update Password
              </button>
            </form>
          ) : (
            <span className={styles.successMessage}>
              Password updated successfully! You can now log in.
            </span>
          )}
          {error && <div className={styles.messageError}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
