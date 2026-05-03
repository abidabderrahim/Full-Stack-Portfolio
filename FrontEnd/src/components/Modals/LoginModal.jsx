import React, { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./Modals.module.css";

const LoginModal = ({ isOpen, onClose, openRegister, setUser }) => {
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
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) return "Invalid email";
    if (!password) return "Password is required";
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) return "Weak password";

    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return showError(validationError);

    try {
      const res = await api.post("/auth/login", { email, password });
      setUser(res.data.user);
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || "Login failed");
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
    <div className={styles.loginModal} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.active : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          {/* Header */}
          <div className={styles.headerLogin}>
            <h2 className={styles.title}>Welcome Back</h2>
            <p className={styles.subtitle}>Sign In with your account</p>
          </div>
          {/* Login Form */}
          <form className={styles.form} onSubmit={handleLogin}>
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
              Login
            </button>
          </form>
          <p className={styles.switchText}>
            Don't have an account?{" "}
            <span
              className={styles.switchLink}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                openRegister();
              }}
            >
              Sign Up
            </span>
            <span
              className={styles.forgotLink}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                window.dispatchEvent(new CustomEvent("openForgotPassword"));
              }}
            >
              Forgot Password?
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

export default LoginModal;
