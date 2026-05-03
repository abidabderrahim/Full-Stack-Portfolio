import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO";
import { fetchPosts } from "../../services/api";
import styles from "./Blog.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const Blog = () => {
  const [blogConfig, setBlogConfig] = useState({
    title: "",
    subtitle: "",
    description: "",
  });
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const blogWrappersRef = useRef([]);
  const tabsBoxRef = useRef(null);

  /* Automatically hide message after 3 seconds */
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000); // hide after 3 seconds

    return () => clearTimeout(timer);
  }, [message]);

  /* Load Config */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/Config/PortfolioConfig.json");
        if (!res.ok) throw new Error("Failed to load config");
        const config = await res.json();
        setBlogConfig(config.portfolio_config.blog);
      } catch (err) {
        console.error("Error loading JSON:", err);
      }
    };
    loadConfig();
  }, []);

  /* Load Posts + Categories */
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchPosts();
        setPosts(res.data || []);
        setFilteredPosts(res.data || []);

        const catRes = await fetch(`${API_URL}/api/categories/posts`);
        if (!catRes.ok) throw new Error("Failed to load categories");
        const catData = await catRes.json();
        setCategories(catData.data || []);
      } catch (err) {
        console.error("Error loading posts/categories:", err);
      }
    };
    loadData();
  }, []);

  /* Load More */
  const loadMore = () =>
    setVisibleCount((prev) => Math.min(prev + 2, filteredPosts.length));

  /* Cursor Effect */
  useEffect(() => {
    if (!filteredPosts.length) return;
    const handlers = [];

    blogWrappersRef.current.forEach((wrapper) => {
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
  }, [filteredPosts, visibleCount]);

  /* Subscribe Form */
  const handleSubscribe = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Something went wrong.");
      } else {
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error, try again later.");
    }
  };

  /* Search */
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setFilteredPosts(posts);
      setSuggestions([]);
      setVisibleCount(6);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/posts/search?query=${encodeURIComponent(value)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSuggestions(data.data || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  /* Submit */
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setFilteredPosts(posts);
      setSuggestions([]);
      setVisibleCount(6);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/posts/search?query=${encodeURIComponent(searchTerm)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setFilteredPosts(data.data || []);
      setSuggestions([]);
      setVisibleCount(data.data?.length || 6);
    } catch (err) {
      console.error(err);
      setFilteredPosts([]);
    }
  };

  /* Categories */
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    if (cat === "all") {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter((p) => p.category?.name === cat));
    }
    setVisibleCount(6);
  };

  /* Scroll Icons */
  const handleIcons = () => {
    const tabsBox = tabsBoxRef.current;
    if (!tabsBox) return;

    const scrollVal = tabsBox.scrollLeft;
    const maxScrollableWidth = tabsBox.scrollWidth - tabsBox.clientWidth;
    setShowLeft(scrollVal > 0);
    setShowRight(maxScrollableWidth - scrollVal > 1);
  };

  const scrollTabs = (direction) => {
    const tabsBox = tabsBoxRef.current;
    if (!tabsBox) return;
    let newScroll = tabsBox.scrollLeft + (direction === "left" ? -340 : 340);
    tabsBox.scrollTo({ left: newScroll, behavior: "smooth" });
  };

  useEffect(() => {
    const tabsBox = tabsBoxRef.current;
    if (!tabsBox) return;

    handleIcons();

    const handleScroll = () => handleIcons();
    const handleResize = () => handleIcons();

    tabsBox.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      tabsBox.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [categories]);

  return (
    <>
      <SEO page="blog" />
      {/* Navbar */}
      <Navbar />
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>{blogConfig.title}</h1>
            <h3 className={styles.subtitle}>{blogConfig.subtitle}</h3>
            <p className={styles.description}>{blogConfig.description}</p>
          </div>
        </div>
      </section>
      {/* Blog */}
      <section className={styles.blog}>
        <div className="container">
          <div className={styles.content}>
            {/* Search */}
            <div className={styles.searchCategory}>
              <div className={styles.searchForm}>
                <form className={styles.form} onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search blog posts..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={handleInputChange}
                  />
                  <button type="submit" className={styles.searchBtn}>
                    Search
                  </button>
                </form>
                {/* Suggestions */}
                <div className={styles.searchSuggestions}>
                  {suggestions.length > 0 && (
                    <ul className={styles.suggestions}>
                      {suggestions.map((s) => (
                        <li
                          key={s._id}
                          onClick={() => {
                            setSearchTerm(s.title);
                            setFilteredPosts([s]);
                            setSuggestions([]);
                            setVisibleCount(1);
                          }}
                        >
                          {s.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            {/* Categories */}
            <div className={styles.wrapper}>
              {showLeft && (
                <div
                  className={`${styles.icon} ${styles.left}`}
                  onClick={() => scrollTabs("left")}
                >
                  <i className="ri-arrow-left-s-line"></i>
                </div>
              )}
              <ul ref={tabsBoxRef} className={styles.tabsBox}>
                <li
                  key="all"
                  className={`${styles.tab} ${
                    activeCategory === "all" ? styles.active : ""
                  }`}
                  onClick={() => handleCategoryClick("all")}
                >
                  All
                </li>
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    className={`${styles.tab} ${
                      activeCategory === cat.name ? styles.active : ""
                    }`}
                    onClick={() => handleCategoryClick(cat.name)}
                  >
                    {cat.name} [ {cat.count} ]
                  </li>
                ))}
              </ul>
              {showRight && (
                <div
                  className={`${styles.icon} ${styles.right}`}
                  onClick={() => scrollTabs("right")}
                >
                  <i className="ri-arrow-right-s-line"></i>
                </div>
              )}
            </div>
            {/* Posts */}
            <div className={styles.posts}>
              {filteredPosts.length > 0 ? (
                filteredPosts.slice(0, visibleCount).map((post, idx) => (
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
            {visibleCount < filteredPosts.length && (
              <div className={styles.loadButton}>
                <button onClick={loadMore} className={styles.morePostsBtn}>
                  Check More Posts
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Subscribe */}
      <section className={styles.subscribe}>
        <div className="container">
          <div className={styles.content}>
            <h2 className={styles.title}>Subscribe For Newsletter</h2>
            <div className={styles.subscribeForm}>
              <form className={styles.form} onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Your Email..."
                  className={styles.subscribeInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className={styles.subscribeBtn}>
                  Subscribe
                </button>
              </form>
            </div>
            <p className={styles.subtitle}>
              Stay Updated With The Latest Posts.
            </p>
            {message && <div className={styles.messageError}>{message}</div>}
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </>
  );
};

export default Blog;
