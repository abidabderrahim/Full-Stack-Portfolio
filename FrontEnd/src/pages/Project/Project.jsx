// src/pages/Project/Project.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO";
import styles from "./Project.module.css";
import {
  fetchProjectById,
  fetchTestimonialsByProject,
  fetchProjectsByCategory,
} from "../../services/api";
import { fetchUser } from "../../utils/auth";
import TestimonialModal from "../../components/Modals/TestimonialModal";
import ReplayTestimonialModal from "../../components/Modals/ReplayTestimonialModal";

const Project = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [hasAddedView, setHasAddedView] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [isTestimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [replayModalData, setReplayModalData] = useState(null);
  const [relatedProjects, setRelatedProjects] = useState([]);

  // Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      const u = await fetchUser();
      setUser(u);
    };
    loadUser();
  }, []);

  // Toggle Like
  const toggleLike = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("openLoginModal"));
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/like`, {
        method: "POST",
        credentials: "include",
      });
      setLiked(!liked);
      setProject((prev) => ({
        ...prev,
        likes: liked
          ? prev.likes.filter((uid) => uid !== user._id)
          : [...(prev.likes || []), user._id],
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Add view
  const addView = async (projectId) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/view`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Load project + testimonials
  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetchProjectById(id);

        // Fix relative images
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = res.data.content;
        tempDiv.querySelectorAll("img").forEach((img) => {
          if (img.src && img.src.startsWith("/")) {
            img.src = `${import.meta.env.VITE_API_URL}${img.getAttribute(
              "src"
            )}`;
          }
        });

        setProject({
          ...res.data,
          content: tempDiv.innerHTML,
        });

        setLiked(user ? res.data.likes?.includes(user._id) : false);

        // --- Add view safely ---
        const userId = user?._id;
        const alreadyViewed = userId
          ? res.data.views?.some((v) => v === userId)
          : false;

        if (!hasAddedView && !alreadyViewed) {
          await addView(res.data._id);
        }

        setHasAddedView(true);

        // Always show correct views count
        setViewsCount(res.data.views?.length || 0);

        // Load testimonials
        const tRes = await fetchTestimonialsByProject(id);
        setTestimonials(tRes);
      } catch (err) {
        console.error("Error fetching project:", err);
        setProject(null);
      }
    };

    loadProject();
  }, [id]);

  // Related Projects
  useEffect(() => {
    const loadRelatedProjects = async () => {
      if (!project?.category?._id) return;

      try {
        const res = await fetchProjectsByCategory(
          project.category._id,
          project._id
        );
        // ensure it's an array
        setRelatedProjects(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Error fetching related projects:", err);
        setRelatedProjects([]);
      }
    };

    loadRelatedProjects();
  }, [project]);

  // Cursor Effect
  const relatedWrappersRef = useRef([]);

  useEffect(() => {
    if (!relatedWrappersRef.current.length) return;

    const handlers = [];

    relatedWrappersRef.current.forEach((wrapper) => {
      if (!wrapper) return;
      const cursor = wrapper.querySelector(`.${styles.cursorCircle}`);
      if (!cursor) return;

      let mouseX = 0,
        mouseY = 0,
        currentX = 0,
        currentY = 0,
        isHovering = false,
        anim;

      const onMouseMove = (e) => {
        const rect = wrapper.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      };

      const onMouseEnter = () => {
        isHovering = true;
        cursor.style.opacity = 1;
        cursor.style.transform = "scale(1)";
        if (!anim) animate();
      };

      const onMouseLeave = () => {
        isHovering = false;
        cursor.style.opacity = 0;
        cursor.style.transform = "scale(0.5)";
        cancelAnimationFrame(anim);
        anim = null;
      };

      function animate() {
        if (!isHovering) return;
        currentX += (mouseX - currentX) * 0.15;
        currentY += (mouseY - currentY) * 0.15;
        const cursorSize = cursor.offsetWidth / 2;
        cursor.style.left = `${currentX - cursorSize}px`;
        cursor.style.top = `${currentY - cursorSize}px`;
        anim = requestAnimationFrame(animate);
      }

      wrapper.addEventListener("mousemove", onMouseMove);
      wrapper.addEventListener("mouseenter", onMouseEnter);
      wrapper.addEventListener("mouseleave", onMouseLeave);

      handlers.push({ wrapper, onMouseMove, onMouseEnter, onMouseLeave });
    });

    return () =>
      handlers.forEach(
        ({ wrapper, onMouseMove, onMouseEnter, onMouseLeave }) => {
          wrapper.removeEventListener("mousemove", onMouseMove);
          wrapper.removeEventListener("mouseenter", onMouseEnter);
          wrapper.removeEventListener("mouseleave", onMouseLeave);
        }
      );
  }, [relatedProjects]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Project link copied!");
  };

  // Add testimonial callback
  const handleAddTestimonial = (testimonial) => {
    setTestimonials((prev) => [{ ...testimonial, user }, ...prev]);
  };

  // Add reply callback
  const handleAddReplay = async () => {
  try {
    const tRes = await fetchTestimonialsByProject(id);
    setTestimonials(tRes);
  } catch (err) {
    console.error("Failed to refresh testimonials:", err);
  }
};

  // Check if current user already added a testimonial
  const hasUserTestimonial = user
    ? testimonials.some((t) => t.user?._id === user._id)
    : false;

  if (!project) {
    return (
      <section className={styles.project}>
        <div className="container">
          <p className={styles.errorMessage}>Project not found.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO page="project" slug={project.slug} />
      {/* Navbar */}
      <Navbar user={user} setUser={setUser} />

      <section className={styles.project}>
        <div className="container">
          <div className={styles.content}>
            {/* Project Image */}
            <div className={styles.projectImage}>
              <img
                src={project.image || "/Images/default-project.webp"}
                alt={project.title}
                className={styles.image}
              />
            </div>

            {/* Project Info */}
            <div className={styles.projectInfo}>
              <h3 className={styles.title}>{project.title}</h3>
              <div className={styles.type}>
                <span className={styles.category}>
                  {project.category?.name || "Uncategorized"}
                </span>
                <div className={styles.sep}></div>
                <span className={styles.time}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className={styles.description}>{project.description}</p>
            </div>

            {/* Project Content */}
            <div
              className={styles.projectContent}
              dangerouslySetInnerHTML={{ __html: project.content }}
            />

            {/* Project Tools */}
            <div className={styles.projectTools}>
              <h3 className={styles.title}>Tools</h3>
              <div className={styles.toolsList}>
                {project.techStack?.map((tool, i) => (
                  <span key={i} className={styles.tool}>
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Project Link */}
            {project.link && (
              <div className={styles.projectLink}>
                <h3 className={styles.title}>View Project</h3>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {project.link}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Project Stats */}
      <div className={styles.projectStats}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.projectActions}>
              <button
                className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
                onClick={toggleLike}
              >
                {liked ? (
                  <>
                    <i className="ri-heart-fill"></i> Liked
                  </>
                ) : (
                  <>
                    <i className="ri-heart-line"></i> Like
                  </>
                )}{" "}
                {project.likes?.length || 0}
              </button>
              <button className={styles.shareBtn} onClick={handleShare}>
                <i className="ri-links-fill"></i> Share
              </button>
              <span className={styles.views}>
                <i className="ri-eye-line"></i> {viewsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={styles.testimonials}>
        <div className="container">
          <div className={styles.content}>
            <h3 className={styles.title}>Testimonials</h3>

            {testimonials.length === 0 && (
              <p className={styles.notestimonialMessage}>
                No testimonials yet.
              </p>
            )}

            {testimonials.map((t) => (
              <div key={t._id} className={styles.testimonialCard}>
                <div className={styles.testimonialUser}>
                  <img
                    src={t.image || "/Images/default-user.webp"}
                    alt={t.nameClient}
                    className={styles.testimonialImage}
                  />
                  <p className={styles.testimonialText}>{t.description}</p>
                  <div className={styles.clientInfo}>
                    <h4 className={styles.testimonialName}>{t.nameclient}</h4>
                    <span className={styles.testimonialJob}>{t.jobclient}</span>
                  </div>
                </div>

                {/* Replies */}
                <div className={styles.replies}>
                  {t.replies?.map((r, index) => (
                    <div key={index} className={styles.replyCard}>
                      <span className={styles.replyAdmin}>
                        {r.adminName?.fullName || "Admin"}
                      </span>
                      <p className={styles.replyMsg}>{r.message}</p>
                    </div>
                  ))}

                  {/* Admin Reply Button */}
                  {user?.isAdmin && (
                    <button
                      className={styles.replyBtn}
                      onClick={() =>
                        setReplayModalData({
                          testimonialId: t._id,
                          existingReplies: t.replies,
                        })
                      }
                    >
                      Reply as Admin
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* User/Admin rules for adding testimonials */}
            {user ? (
              <>
                {!user.isAdmin ? (
                  hasUserTestimonial ? (
                    <p className={styles.alreadyTestimonialMessage}>
                      You have already added a testimonial for this project.
                    </p>
                  ) : (
                    <div className={styles.testimonialBtn}>
                      <button
                        className={styles.addTestimonialBtn}
                        onClick={() => setTestimonialModalOpen(true)}
                      >
                        Add Testimonial
                      </button>
                    </div>
                  )
                ) : (
                  <p className={styles.adminNote}>
                    Admins cannot add testimonials, only reply to them.
                  </p>
                )}
              </>
            ) : (
              <p className={styles.nologintestimonialMessage}>
                You must be logged in to Add Testimonial.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Related Projects Section */}

      <section className={styles.relateds}>
        <div className="container">
          {relatedProjects.length > 0 ? (
            <div className={styles.content}>
              <h1 className={styles.title}>Related Projects</h1>
              <div className={styles.projects}>
                {relatedProjects.length > 0 &&
                  relatedProjects.map((proj, idx) => (
                    <Link
                      to={`/project/${proj._id}`}
                      key={proj._id}
                      className={styles.relatedProject}
                    >
                      <div
                        className={styles.imageWrapper}
                        ref={(el) => (relatedWrappersRef.current[idx] = el)}
                      >
                        <img
                          src={proj.image || "/Images/default-project.webp"}
                          alt={proj.title}
                          className={styles.postImage}
                        />
                        <span className={styles.cursorCircle}>
                          View Project
                        </span>
                      </div>
                      <div className={styles.postInfo}>
                        <div className={styles.postMeta}>
                          <span className={styles.postCategory}>
                            {proj.category?.name || "Uncategorized"}
                          </span>
                          <span className={styles.sep}></span>
                          <span className={styles.postTime}>
                            {new Date(proj.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className={styles.postTitle}>{proj.title}</h3>
                        <p className={styles.postDesc}>{proj.description}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ) : (
            <p className={styles.messageLoading}>
              No related projects available.
            </p>
          )}
        </div>
      </section>

      {/* Modals */}
      <TestimonialModal
        isOpen={isTestimonialModalOpen}
        onClose={() => setTestimonialModalOpen(false)}
        projectId={id}
        setTestimonials={handleAddTestimonial}
        user={user} // pass user to modal for extra check
      />

      {replayModalData && (
        <ReplayTestimonialModal
          isOpen={!!replayModalData}
          onClose={() => setReplayModalData(null)}
          testimonialId={replayModalData.testimonialId}
          existingReplies={replayModalData.existingReplies}
          onSuccess={handleAddReplay}
        />
      )}

      <Footer />
    </>
  );
};

export default Project;
