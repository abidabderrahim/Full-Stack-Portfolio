import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Footer.module.css";

function Footer() {
  const [contact, setContact] = useState({
    title: "",
    subtitle: "",
    button_text: "",
  });
  const [footer, setFooter] = useState({
    copy: "",
    social_links: [],
  });

  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((data) => {
        setContact(data.portfolio_config.contact || {});
        setFooter(data.portfolio_config.footer || { social_links: [] });
      })
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  return (
    <>
      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.content}>
            {/* Contact Section */}
            <div className={styles.footerFirst}>
              <h1 className={styles.title}>{contact.title}</h1>
              <h3 className={styles.subtitle}>{contact.subtitle}</h3>
              <Link to="/contact" className={styles.contactUrl}>
                {contact.button_text}
              </Link>
            </div>

            {/* Social Links Section */}
            <div className={styles.footerLast}>
              <span className={styles.copy}>{footer.copy}</span>
              <div className={styles.media}>
                {footer.social_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.platform}
                  >
                    <i className={link.icon}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;