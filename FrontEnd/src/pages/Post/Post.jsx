import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO";
import ReplayModal from "../../components/Modals/ReplayModal";
import styles from "./Post.module.css";
import {
  fetchPostById,
  fetchCommentsByPost,
  addComment,
  addReply,
  fetchPostsByCategory,
} from "../../services/api";
import { fetchUser } from "../../utils/auth";

const Post = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [hasAddedView, setHasAddedView] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [fullName, setFullName] = useState("");
  const [job, setJob] = useState("");
  const [error, setError] = useState("");

  // Reply modal
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null);

  // Load user
  useEffect(() => {
    const loadUser = async () => {
      const u = await fetchUser();
      setUser(u);
      if (u && !u.isAdmin) setFullName(u.fullName || "");
    };
    loadUser();
  }, []);

  // Load post and comments
  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await fetchPostById(id);
        const postData = res.data;

        // Fix relative images
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = postData.content;
        tempDiv.querySelectorAll("img").forEach((img) => {
          if (img.src && img.src.startsWith("/")) {
            img.src = `${import.meta.env.VITE_API_URL}${img.getAttribute(
              "src"
            )}`;
          }
        });

        setPost({ ...postData, content: tempDiv.innerHTML });
        setLiked(user ? postData.likes?.includes(user._id) : false);
        setViewsCount(postData.views?.length || 0);

        // Add view only if logged-in user hasn’t seen it yet
        if (user && !postData.views?.includes(user._id) && !hasAddedView) {
          const viewRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/posts/${id}/view`,
            { method: "POST", credentials: "include" }
          );
          const viewData = await viewRes.json();
          setViewsCount(viewData.views || postData.views?.length || 0);
          setHasAddedView(true); // Mark that the user has added view
        }

        // Load comments
        const commentsData = await fetchCommentsByPost(id);
        setComments(Array.isArray(commentsData) ? commentsData : []);
      } catch (err) {
        console.error(err);
        setPost(null);
        setComments([]);
      }
    };

    loadPost();
  }, [id, user, hasAddedView]); // added hasAddedView to dependency

  // Load related posts when `post` state changes
  useEffect(() => {
    const loadRelatedPosts = async () => {
      if (!post?.category?._id) return;

      try {
        const related = await fetchPostsByCategory(post.category._id, post._id);
        // Ensure we set an array
        setRelatedPosts(Array.isArray(related) ? related : []);
      } catch (err) {
        console.error("Error fetching related posts:", err);
        setRelatedPosts([]);
      }
    };

    loadRelatedPosts();
  }, [post]);

  // inside your component
  const relatedWrappersRef = useRef([]);

  // Cursor hover effect
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
  }, [relatedPosts]);

  // Toggle Like
  const toggleLike = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("openLoginModal"));
      return;
    }

    try {
      setLiked(!liked);
      setPost((prev) => ({
        ...prev,
        likes: liked
          ? prev.likes.filter((uid) => uid !== user._id)
          : [...(prev.likes || []), user._id],
      }));

      await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${id}/like`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Post link copied!");
  };

  // Add comment (users only)
  const handleAddComment = async () => {
    if (!user || user.isAdmin) {
      window.dispatchEvent(new CustomEvent("openLoginModal"));
      return;
    }

    if (!fullName.trim() || !job.trim() || !newComment.trim()) {
      setError("Full Name, Job, and Comment are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const comment = await addComment(id, {
        fullName: fullName.trim(),
        job: job.trim(),
        message: newComment.trim(),
      });
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      setJob("");
    } catch (err) {
      console.error("Add comment error:", err);
      setError("Failed to add comment");
    }
  };

  const gradients = [
    "linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #843B62)",
    "linear-gradient(135deg, #FF9A8B, #FF6A88, #FF99AC, #FBCB9A, #F5E960)",
    "linear-gradient(135deg, #00C9FF, #92FE9D, #FCEE21, #F79D00, #64B3F4)",
    "linear-gradient(135deg, #7F00FF, #E100FF, #00C6FF, #0072FF, #00F260)",
    "linear-gradient(135deg, #FFDEE9, #B5FFFC, #C9FFBF, #FFAFBD, #FBD786)",
    "linear-gradient(135deg, #FAD961, #F76B1C, #F54EA2, #A94CAF, #3B2667)",
    "linear-gradient(135deg, #43C6AC, #191654, #F0C27B, #4B1248, #C94B4B)",
    "linear-gradient(135deg, #FF9966, #FF5E62, #FBD786, #C6FFDD, #6DD5FA)",
    "linear-gradient(135deg, #8360C3, #2EBF91, #FFD3A5, #FD6585, #F0E3FF)",
    "linear-gradient(135deg, #A1C4FD, #C2E9FB, #D4FC79, #96E6A1, #FBC2EB)",
    "linear-gradient(135deg, #FEE140, #FA709A, #84FAB0, #8FD3F4, #A6C0FE)",
    "linear-gradient(135deg, #4E54C8, #8F94FB, #A9C9FF, #FFBBEC, #FEB692)",
    "linear-gradient(135deg, #30E8BF, #FF8235, #4ECDC4, #556270, #FF6B6B)",
    "linear-gradient(135deg, #12C2E9, #C471ED, #F64F59, #F9D423, #30E8BF)",
    "linear-gradient(135deg, #FC466B, #3F5EFB, #00C9FF, #92FE9D, #FBD786)",
    "linear-gradient(135deg, #F7971E, #FFD200, #F54EA2, #A94CAF, #3B2667)",
    "linear-gradient(135deg, #C6FFDD, #FBD786, #f7797d, #CB356B, #BD3F32)",
    "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045, #F77737, #FCAF45)",
    "linear-gradient(135deg, #FF5F6D, #FFC371, #6A11CB, #2575FC, #FF0844)",
    "linear-gradient(135deg, #0093E9, #80D0C7, #FAD0C4, #FFD1FF, #FFDEE9)",
  ];

  const randomGradient =
    gradients[Math.floor(Math.random() * gradients.length)];

  // Open reply modal (admin only)
  const handleOpenReplyModal = (commentId) => {
    if (!user?.isAdmin) return;
    setActiveCommentId(commentId);
    setIsReplyModalOpen(true);
  };

  // Add reply (admin only)
  const handleAddReply = async (replyMessage) => {
    if (!activeCommentId || !user?.isAdmin) return;
    try {
      const reply = await addReply(activeCommentId, replyMessage);
      setComments((prev) =>
        prev.map((c) =>
          c._id === activeCommentId
            ? { ...c, replies: [...(c.replies || []), reply] }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      setError("Failed to add reply");
    }
  };

  if (!post) {
    return (
      <section className={styles.post}>
        <div className="container">
          <p className={styles.errorMessage}>Post not found.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO page="post" slug={post.slug} />
      {/* Navbar */}
      <Navbar user={user} setUser={setUser} />
      {/* Post Section */}
      <section className={styles.post}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.postImage}>
              <img
                src={post.image || "/Images/default-post.webp"}
                alt={post.title}
                className={styles.image}
              />
            </div>
            <div className={styles.postInfo}>
              <h3 className={styles.title}>{post.title}</h3>
              <div className={styles.type}>
                <span className={styles.category}>
                  {post.category?.name || "Uncategorized"}
                </span>
                <div className={styles.sep}></div>
                <span className={styles.time}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className={styles.description}>{post.description}</p>
            </div>
            <div
              className={styles.postContent}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </section>

      {/* Post Stats */}
      <section className={styles.postStats}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.postActions}>
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
                {post.likes?.length || 0}
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
      </section>

      {/* Comments Section */}
      <section className={styles.commentsSection}>
        <div className="container">
          <div className={styles.content}>
            <h2 className={styles.title}>Comments</h2>
            {comments.length === 0 && (
              <p className={styles.nocommentMessage}>No comments yet.</p>
            )}
            {Array.isArray(comments) &&
              comments.map((comment) => (
                <div key={comment._id} className={styles.comment}>
                  <div className={styles.commentUser}>
                    <div className={styles.commentInfo}>
                      <div
                        className={styles.avatarProfile}
                        style={{ background: randomGradient }}
                      ></div>
                    </div>
                    <p className={styles.commentText}>{comment.message}</p>
                    <div className={styles.userInfo}>
                      <span className={styles.commentAuthor}>
                        {comment.fullName || "Anonymous"}
                      </span>
                      <span className={styles.commentJob}>
                        {comment.job || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {comment.replies?.length > 0 && (
                    <div className={styles.replies}>
                      {comment.replies.map((reply, idx) => (
                        <div key={idx} className={styles.reply}>
                          <span className={styles.replyAuthor}>
                            {reply.admin?.fullName || "Admin"}
                          </span>
                          <p className={styles.replyText}>{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {user?.isAdmin && (
                    <button
                      className={styles.replyBtn}
                      onClick={() => handleOpenReplyModal(comment._id)}
                    >
                      Reply as Admin
                    </button>
                  )}
                </div>
              ))}

            {user && !user.isAdmin ? (
              <div className={styles.addComment}>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className={styles.input}
                />
                <input
                  type="text"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Your Job Title"
                  className={styles.input}
                />
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={4}
                  maxLength={200}
                  className={styles.textarea}
                />
                <div className={styles.charCount}>
                  {newComment.length} / 200
                </div>
                <button onClick={handleAddComment} className={styles.submitBtn}>
                  Add Comment
                </button>
              </div>
            ) : user?.isAdmin ? (
              <p className={styles.logincommentMessage}>
                Admin cannot comment. Only users can add comments.
              </p>
            ) : (
              <p className={styles.logincommentMessage}>
                You must be logged in to comment.
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
      </section>

      {/* Related Posts Section */}
      <section className={styles.relateds}>
        <div className="container">
          {relatedPosts.length > 0 ? (
            <div className={styles.content}>
              <h1 className={styles.title}>Related Posts</h1>
              <div className={styles.posts}>
                {relatedPosts.length > 0 &&
                  relatedPosts.map((post, idx) => (
                    <Link
                      to={`/post/${post._id}`}
                      key={post._id}
                      className={styles.relatedPost}
                    >
                      <div
                        className={styles.imageWrapper}
                        ref={(el) => (relatedWrappersRef.current[idx] = el)}
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
                  ))}
              </div>
            </div>
          ) : (
            <p className={styles.messageLoading}>No related posts available.</p>
          )}
        </div>
      </section>

      <ReplayModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        onSubmit={handleAddReply}
      />

      <Footer />
    </>
  );
};

export default Post;
