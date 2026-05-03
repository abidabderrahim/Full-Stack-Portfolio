import React, { useEffect, useState, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import LoginModal from "../Modals/LoginModal";
import RegisterModal from "../Modals/RegisterModal";
import ForgotPasswordModal from "../Modals/ForgotPasswordModal";
import ResetPasswordModal from "../Modals/ResetPasswordModal";
import api from "../../services/api";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isLight, setIsLight] = useState(false);
  const [headerName, setHeaderName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetToken, setResetToken] = useState({ email: "", token: "" });
  const [user, setUser] = useState(null);

  const menuRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsLight(true);
      document.body.classList.add("light");
    } else {
      setIsLight(false);
      document.body.classList.remove("light");
    }
  }, []);

  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((data) => setHeaderName(data.portfolio_config.header.name))
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle("light");
    setIsLight(!isLight);
    localStorage.setItem("theme", !isLight ? "light" : "dark");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openLoginModal = () => {
    setIsLoginOpen(true);
    setIsOpen(false);
  };

  const openRegisterModal = () => {
    setIsRegisterOpen(true);
    setIsOpen(false);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        setUser(res.data.user || null);
      } catch {}
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      setUser(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    const email = query.get("email");

    if (token && email) {
      setResetToken({ token, email });
      setIsResetOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const openForgot = () => setIsForgotOpen(true);
    window.addEventListener("openForgotPassword", openForgot);
    return () => window.removeEventListener("openForgotPassword", openForgot);
  }, []);

  useEffect(() => {
    const handleOpenLogin = () => setIsLoginOpen(true);
    window.addEventListener("openLoginModal", handleOpenLogin);
    return () => window.removeEventListener("openLoginModal", handleOpenLogin);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.myName}>
              <div className={styles.dot}></div>
              <Link to="/" className={styles.link}>
                {headerName || "Loading..."}
              </Link>
            </div>
            <nav className={styles.nav}>
              <ul className={styles.navLinks}>
                <li className={styles.listLink}>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                    end
                  >
                    Home
                  </NavLink>
                </li>
                <li className={styles.listLink}>
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                  >
                    About
                  </NavLink>
                </li>
                <li className={styles.listLink}>
                  <NavLink
                    to="/blog"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                  >
                    Blog
                  </NavLink>
                </li>
                <li className={styles.listLink}>
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                  >
                    Contact
                  </NavLink>
                </li>
              </ul>

              <div className={styles.navButtons}>
                {user ? (
                  <>
                    <button onClick={handleLogout} className={styles.login}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className={styles.login}
                    >
                      Login
                    </button>
                  </>
                )}
                <button onClick={toggleTheme} className={styles.theme}>
                  {isLight ? "Dark" : "Light"}
                </button>
              </div>
            </nav>
            <div className={styles.buttonOpen}>
              <button className={styles.open} onClick={() => setIsOpen(true)}>
                <i className="ri-menu-4-line"></i>
              </button>
            </div>
            <menu
              ref={menuRef}
              className={`${styles.menu} ${isOpen ? styles.open : ""}`}
            >
              <div className={styles.buttonClose}>
                <button
                  className={styles.close}
                  onClick={() => setIsOpen(false)}
                >
                  <i className="ri-menu-5-line"></i>
                </button>
              </div>

              <ul className={styles.navLinks}>
                <li className={styles.listLink}>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                    end
                  >
                    Home
                  </NavLink>
                </li>
                <li className={styles.listLink}>
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                  >
                    About
                  </NavLink>
                </li>
                <li className={styles.listLink}>
                  <NavLink
                    to="/blog"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                  >
                    Blog
                  </NavLink>
                </li>
                <li className={styles.listLink}>
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ""}`
                    }
                  >
                    Contact
                  </NavLink>
                </li>
              </ul>

              <div className={styles.menuButtons}>
                {user ? (
                  <>
                    <button onClick={handleLogout} className={styles.login}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className={styles.login}
                    >
                      Login
                    </button>
                  </>
                )}
                <button onClick={toggleTheme} className={styles.theme}>
                  {isLight ? "Dark" : "Light"}
                </button>
              </div>
            </menu>
          </div>
        </div>
      </header>
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openRegister={openRegisterModal}
        setUser={setUser}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        openLogin={openLoginModal}
        setUser={setUser}
      />
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        tokenData={resetToken}
      />
    </>
  );
};

export default Navbar;
