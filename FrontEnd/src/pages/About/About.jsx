import React from "react";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO";
import styles from "./About.module.css";

const About = () => {
  const [about, setAbout] = useState({});

  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((data) => {
        setAbout(data.about_me || data.portfolio_config?.about_me || {});
      })
      .catch((err) => {
        console.error("Error loading JSON:", err);
      })
  }, []);

  return (
    <>
    <SEO page="about" />
      {/* Navbar */}
      <Navbar />
      {/* About Section */}
      <section className={styles.about}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.myProfile}>
              {/* Profile Image */}
              <div className={styles.profileImage}>
                {about.photo && (
                  <img
                    src={about.photo}
                    alt={about.name || "Profile"}
                    className={styles.image}
                  />
                )}
              </div>
              {/* Profile Info */}
              <div className={styles.profileInfo}>
                {about.name && <h1 className={styles.name}>{about.name}</h1>}
                {about.title && <p className={styles.title}>{about.title}</p>}
                {about.description && (
                  <p className={styles.description}>{about.description}</p>
                )}
                {/* About Me Items */}
                <div className={styles.aboutMe}>
                  {about.items?.map((item, index) => (
                    <div key={index} className={styles.aboutMeInfo}>
                      <div className={styles.aboutMeInfoHead}>
                        <div className={styles.titleBlock}>
                          <h3 className={styles.infoNumber}>{item.number}</h3>
                          <h3 className={styles.infoTitle}>{item.title}</h3>
                        </div>
                        <div className={styles.aboutMeInfoOpen}>
                          <i className="ri-sparkling-2-line"></i>
                        </div>
                      </div>
                      <div className={styles.aboutMeInfoDescription}>
                        {item.skills ? (
                          <>
                            <div className={styles.skillsContainer}>
                              <strong className={styles.skillsLabel}>
                                Technical Skills:
                              </strong>
                              <div className={styles.skillsList}>
                                {item.skills.technical.map((tech, i) => (
                                  <span key={i} className={styles.skill}>
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className={styles.skillsContainer}>
                              <strong className={styles.skillsLabel}>
                                Soft Skills:
                              </strong>
                              <div className={styles.skillsList}>
                                {item.skills.soft.map((soft, i) => (
                                  <span key={i} className={styles.skill}>
                                    {soft}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          item.description?.map((desc, i) => (
                            <p key={i}>{desc}</p>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                  {about.resumeLink && (
                    <a href={about.resumeLink} className={styles.resumeLink}>
                      My Resume
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </>
  );
};

export default About;