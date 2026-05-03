import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO";
import {
  fetchPosts,
  fetchProjects,
  fetchUserTestimonials,
} from "../../services/api";
import styles from "./Home.module.css";

const Home = () => {
  const [hero, setHero] = useState({});
  const [work, setWork] = useState({});
  const [service, setService] = useState({ items: [] });
  const [process, setProcess] = useState({ items: [] });
  const [openIndex, setOpenIndex] = useState(null);

  // Blog posts
  const [latestPosts, setLatestPosts] = useState([]);
  const blogWrappersRef = useRef([]);

  // Projects
  const [projects, setProjects] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState(2);
  const projectWrappersRef = useRef([]);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Testimonials
  const [testimonials, setTestimonials] = useState([]);

  const token = localStorage.getItem("token");

  // Load config JSON
  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((config) => {
        setHero(config.portfolio_config.hero);
        setWork(config.portfolio_config.work);
        setService(config.portfolio_config.services);
        setProcess(config.portfolio_config.process);
      })
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  // Fetch Projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetchProjects();
        // Sort by createdAt descending
        const sortedProjects = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProjects(sortedProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };
    loadProjects();
  }, []);

  const loadMoreProjects = () => setVisibleProjects((prev) => prev + 2);

  // Fetch latest 2 blog posts
  useEffect(() => {
    const loadLatestPosts = async () => {
      try {
        const res = await fetchPosts();
        const sortedPosts = res.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 2);
        setLatestPosts(sortedPosts);
      } catch (err) {
        console.error("Error fetching latest posts:", err);
      }
    };
    loadLatestPosts();
  }, []);

  // Cursor hover effect
  useEffect(() => {
    const applyCursorEffect = (wrappersRef) => {
      if (!wrappersRef.current.length) return;

      const handlers = [];

      wrappersRef.current.forEach((wrapper) => {
        if (!wrapper) return;
        const cursor = wrapper.querySelector(`.${styles.cursorCircle}`);
        if (!cursor) return;

        let mouseX = 0,
          mouseY = 0,
          currentX = 0,
          currentY = 0,
          isHovering = false,
          animationFrame;

        const onMouseMove = (e) => {
          const rect = wrapper.getBoundingClientRect();
          mouseX = e.clientX - rect.left;
          mouseY = e.clientY - rect.top;
        };

        const onMouseEnter = () => {
          isHovering = true;
          cursor.style.opacity = 1;
          cursor.style.transform = "scale(1)";
          if (!animationFrame) animate();
        };

        const onMouseLeave = () => {
          isHovering = false;
          cursor.style.opacity = 0;
          cursor.style.transform = "scale(0.5)";
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        };

        function animate() {
          if (!isHovering) return;
          currentX += (mouseX - currentX) * 0.15;
          currentY += (mouseY - currentY) * 0.15;
          const cursorSize = cursor.offsetWidth / 2;
          cursor.style.left = `${currentX - cursorSize}px`;
          cursor.style.top = `${currentY - cursorSize}px`;
          animationFrame = requestAnimationFrame(animate);
        }

        wrapper.addEventListener("mousemove", onMouseMove);
        wrapper.addEventListener("mouseenter", onMouseEnter);
        wrapper.addEventListener("mouseleave", onMouseLeave);

        handlers.push({ wrapper, onMouseMove, onMouseEnter, onMouseLeave });
      });

      return () => {
        handlers.forEach(
          ({ wrapper, onMouseMove, onMouseEnter, onMouseLeave }) => {
            wrapper.removeEventListener("mousemove", onMouseMove);
            wrapper.removeEventListener("mouseenter", onMouseEnter);
            wrapper.removeEventListener("mouseleave", onMouseLeave);
          }
        );
      };
    };

    const cleanupBlog = applyCursorEffect(blogWrappersRef);
    const cleanupProjects = applyCursorEffect(projectWrappersRef);

    return () => {
      cleanupBlog?.();
      cleanupProjects?.();
    };
  }, [latestPosts, projects.slice(0, visibleProjects)]);

  // Fetch testimonials
  useEffect(() => {
    if (!token) return; // skip API calls if no user is logged in

    const loadTestimonials = async () => {
      try {
        const res = await fetchUserTestimonials();
        setTestimonials(res);
      } catch (err) {
        console.error("Failed to fetch testimonials:", err);
        setTestimonials([]); // fallback
      }
    };

    loadTestimonials();
  }, [token]);

  // Swiper Testimonials init
  useEffect(() => {
    if (!testimonials.length) return;

    const swiper = new window.Swiper(".mySwiper", {
      slidesPerView: "auto",
      spaceBetween: 20,
      loop: false,
      speed: 2500,
      autoplay: {
        delay: 2000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
    });

    return () => swiper.destroy(true, true);
  }, [testimonials.length]);

  return (
    <>
      <SEO page="home" />
      {/* Navbar */}
      <Navbar />
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.myName}>{hero.my_name}</h1>
            <h2 className={styles.myJob}>{hero.my_job}</h2>
            <p className={styles.myBio}>{hero.my_bio}</p>
          </div>
        </div>
      </section>
      {/* Work / Projects Section */}
      <section className={styles.work}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>{work.title}</h1>

            <div className={styles.projects}>
              {projects.slice(0, visibleProjects).length > 0 ? (
                projects.slice(0, visibleProjects).map((project, idx) => (
                  <Link
                    to={`/project/${project._id}`}
                    key={project._id}
                    className={styles.project}
                  >
                    <div
                      className={styles.imageWrapper}
                      ref={(el) => (projectWrappersRef.current[idx] = el)}
                    >
                      <img
                        src={project.image}
                        alt={project.title}
                        className={styles.projectImage}
                      />
                      <span className={styles.cursorCircle}>View Project</span>
                    </div>
                    <div className={styles.projectInfo}>
                      <div className={styles.projectRoleTime}>
                        <span className={styles.projectCategory}>
                          {project.category?.name || "Uncategorized"}
                        </span>
                        <span className={styles.sep}></span>
                        <span className={styles.projectTime}>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className={styles.projectTitle}>{project.title}</h3>
                      <p className={styles.projectDesc}>
                        {project.description}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className={styles.messageLoading}>No projects available.</p>
              )}
            </div>

            {/* Load More Button */}
            {visibleProjects < projects.length && (
              <div className={styles.loadButton}>
                <button
                  onClick={loadMoreProjects}
                  className={styles.moreProjects}
                >
                  Check More Work
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Services Section */}
      <section className={styles.services}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>{service.title}</h1>
            <div className={styles.myServices}>
              {service.items.map((item, index) => (
                <div key={index} className={styles.service}>
                  <div className={styles.serviceTitle}>
                    <h3 className={styles.myTitle}>
                      <i className={item.icon}></i> {item.title}
                    </h3>
                  </div>
                  <div className={styles.serviceFeatures}>
                    {item.features.map((feature, idx) => (
                      <span key={idx} className={styles.feature}>
                        <i className="ri-shining-2-line"></i> {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>Testimonials</h1>
            <div className={styles.myTestimonials}>
              <div className="swiper mySwiper">
                {testimonials.length > 0 ? (
                  <>
                    <div className="swiper-wrapper">
                      {testimonials.map((item, idx) => (
                        <div
                          key={item._id || idx}
                          className={`${styles.testimonial} swiper-slide`}
                        >
                          <img
                            src={item.image || "/default-user.png"}
                            alt={item.client_name}
                            className={styles.testImage}
                          />
                          <p className={styles.testimonialMessage}>
                            {item.description}
                          </p>
                          <div className={styles.details}>
                            <span className={styles.clientName}>
                              {item.nameclient}
                            </span>
                            <span className={styles.clientJob}>
                              {item.jobclient}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Only render shadows if testimonials exist */}
                    <div className={styles.shadowLeft}></div>
                    <div className={styles.shadowRight}></div>
                  </>
                ) : (
                  <p className={styles.messageLoading}>
                    No testimonials available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Process Section */}
      <section className={styles.processSection}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>{process.title}</h1>
            <p className={styles.subtitle}>{process.subtitle}</p>
            <div className={styles.myProcesss}>
              {process.items.map((item, idx) => (
                <div key={idx} className={styles.process}>
                  <div className={styles.processHead}>
                    <div className={styles.headTitle}>
                      <h3 className={styles.processNumber}>{item.number}</h3>
                      <h3 className={styles.processTitle}>{item.title}</h3>
                    </div>
                    <div
                      className={styles.processOpen}
                      onClick={() => toggleAccordion(idx)}
                    >
                      <i className="ri-shining-2-line"></i>
                    </div>
                  </div>
                  <div
                    className={`${styles.processDescription} ${
                      openIndex === idx ? styles.open : ""
                    }`}
                  >
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Blog Section */}
      <section className={styles.blog}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>Latest Blog Posts</h1>
            <div className={styles.posts}>
              {latestPosts.length > 0 ? (
                latestPosts.map((post, idx) => (
                  <Link
                    to={`/post/${post._id}`}
                    key={post._id}
                    className={styles.post}
                  >
                    <div
                      className={styles.imageWrapper}
                      ref={(el) => (blogWrappersRef.current[idx] = el)}
                    >
                      <img
                        src={post.image}
                        alt={post.title}
                        className={styles.postImage}
                      />
                      <span className={styles.cursorCircle}>Read Post</span>
                    </div>
                    <div className={styles.postInfo}>
                      <div className={styles.postMeta}>
                        <span className={styles.postCategory}>
                          {post.category?.name || "Uncategorized"}
                        </span>
                        <span className={styles.sep}></span>
                        <span className={styles.postTime}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      <p className={styles.postDesc}>{post.description}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className={styles.messageLoading}>No posts available.</p>
              )}
            </div>
            <div className={styles.blogLink}>
              <Link to="/blog" className={styles.link}>
                Explore My Blog
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </>
  );
};

export default Home;
