import React, { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./Modals.module.css";

const RegisterModal = ({ isOpen, onClose, openLogin, setUser }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const validateForm = () => {
    if (fullName.length < 3) return "Name too short";
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return "Invalid email format";
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return "Password too weak";
    }
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return showError(validationError);

    try {
      const res = await api.post("/auth/register", {
        fullName,
        email,
        password,
      });
      setUser(res.data.user);
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || "Registration failed");
    }
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const handleGoogle = () => {
    const redirect = encodeURIComponent(window.location.pathname);
    window.open(
      `http://localhost:5000/api/auth/google?redirect=${redirect}`,
      "_self"
    );
  };

  return (
    <div className={styles.RegisterModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          {/* Header */}
          <div className={styles.headerRegister}>
            <h2 className={styles.title}>Create Account</h2>
            <p className={styles.subtitle}>Sing Up with your details</p>
          </div>
          {/* Register Form */}
          <form className={styles.form} onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            <button type="submit" className={styles.submitBtn}>
              Register
            </button>
          </form>
          <p className={styles.switchText}>
            Already have an account?{" "}
            <span
              className={styles.switchLink}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                openLogin();
              }}
            >
              Sign In
            </span>
          </p>
          <button className={styles.googleBtn} onClick={handleGoogle}>
            <img src="/Images/google-logo.svg" alt="Google Logo" />
            Continue with Google
          </button>
          {error && <div className={styles.messageError}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
