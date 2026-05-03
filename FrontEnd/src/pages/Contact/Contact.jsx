// Contact.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import SEO from "../../components/SEO";
import styles from "./Contact.module.css";
import { fetchUser } from "../../utils/auth";

const Contact = () => {
  const [connect, setConnect] = useState({});
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState(null);

  const [footer, setFooter] = useState({ copy: "", social_links: [] });

  // Load user + auto fill
  useEffect(() => {
    const loadUser = async () => {
      const u = await fetchUser();
      setUser(u);

      if (u) {
        setForm((prev) => ({
          ...prev,
          fullName: u.fullName || "",
          email: u.email || "",
        }));
      }
    };

    loadUser();
  }, []);

  // Load config
  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((data) => setConnect(data?.portfolio_config?.connect || {}))
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!user) {
    alert("You must be logged in to send a message.");
    window.dispatchEvent(new CustomEvent("openLoginModal"));
    return;
  }

  setStatus("loading");

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/contact`,
      {
        method: "POST",
        credentials: "include", // ✅ IMPORTANT (sends cookie token)
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: form.message, // ONLY message is sent
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setStatus("success");
      setForm((prev) => ({
        ...prev,
        message: "",
      }));
    } else {
      setStatus("error");
    }
  } catch (err) {
    console.error("Submit error:", err);
    setStatus("error");
  }
};


  // Footer
  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((configJson) => {
        setFooter(
          configJson.portfolio_config.footer || {
            copy: "",
            social_links: [],
          }
        );
      })
      .catch((err) =>
        console.error("Error loading Portfolio config:", err)
      );
  }, []);

  return (
    <>
      <SEO page="contact" />
      <Navbar />

      {connect.form && (
        <section className={styles.contact}>
          <div className="container">
            <div className={styles.content}>
              <div className={styles.contactFirst}>
                <p className={styles.subtitle}>{connect.subtitle}</p>
                <h3 className={styles.title}>{connect.title}</h3>

                <form className={styles.contactForm} onSubmit={handleSubmit}>
                  {/* NAME (READ ONLY) */}
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    readOnly
                    className={styles.contactInput}
                    placeholder={connect.form.name_placeholder}
                  />

                  {/* EMAIL (READ ONLY) */}
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    readOnly
                    className={styles.contactInput}
                    placeholder={connect.form.email_placeholder}
                  />

                  {/* MESSAGE ONLY EDITABLE */}
                  <textarea
                    name="message"
                    value={form.message}
                    maxLength={500}
                    onChange={handleChange}
                    className={styles.contactMessage}
                    placeholder={connect.form.message_placeholder}
                    required
                  />

                  <button type="submit" className={styles.contactBtn}>
                    {connect.form.button_text}
                  </button>
                </form>

                {status === "loading" && (
                  <p className={styles.errorMessage}>Sending...</p>
                )}
                {status === "success" && (
                  <p className={styles.errorMessage}>
                    Message sent successfully!
                  </p>
                )}
                {status === "error" && (
                  <p className={styles.errorMessage}>
                    Failed to send message.
                  </p>
                )}
              </div>

              {/* RIGHT SIDE */}
              <div className={styles.contactLast}>
                <div className={styles.about}>
                  <h3 className={styles.title}>
                    {connect.about?.title}
                  </h3>

                  <img
                    src={
                      connect.about?.profile_image ||
                      "/Images/profile.webp"
                    }
                    alt="profile"
                    className={styles.profile}
                  />

                  <h3 className={styles.myName}>
                    {connect.about?.name}
                  </h3>

                  <p className={styles.desc}>
                    {connect.about?.description}
                    <Link
                      to={connect.about?.read_more_link}
                      className={styles.readMore}
                    >
                      Read More
                    </Link>
                  </p>

                  <h3 className={styles.signature}>
                    {connect.about?.signature}
                  </h3>
                </div>

                <div className={styles.media}>
                  <h3 className={styles.title}>
                    {connect.media?.title}
                  </h3>

                  <div className={styles.mediaLinks}>
                    {connect.media?.links?.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className={link.icon}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.content}>
            <span className={styles.copy}>{footer.copy}</span>

            <div className={styles.media}>
              {footer.social_links?.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className={styles.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i
                    className={
                      link.platform === "LinkedIn"
                        ? "ri-linkedin-line"
                        : link.platform === "Github"
                        ? "ri-github-line"
                        : link.platform === "Instagram"
                        ? "ri-instagram-line"
                        : ""
                    }
                  ></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Contact;