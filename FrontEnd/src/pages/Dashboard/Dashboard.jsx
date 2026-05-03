import React, { useEffect, useState } from "react";
import { ResponsivePie } from "@nivo/pie";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import PostModal from "../../components/Modals/PostModal";
import ProjectModal from "../../components/Modals/ProjectModal";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import styles from "./Dashboard.module.css";
import {
  fetchPosts,
  fetchProjects,
  fetchUsers,
  fetchSubscribers,
  fetchUserTestimonials,
  deletePost,
  fetchPostById,
  fetchProjectById,
  deleteProject,
  deleteSubscriber,
  deleteUser,
  deleteTestimonial,
} from "../../services/api";

const Dashboard = () => {
  const navigate = useNavigate();

  // Footer
  const [footer, setFooter] = useState({ copy: "", social_links: [] });

  // Modals
  const [editingPost, setEditingPost] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  // Stats
  const [stats, setStats] = useState({
    postsCount: 0,
    projectsCount: 0,
    usersCount: 0,
    subscribersCount: 0,
    testimonialsCount: 0, // new
  });

  // ===== Posts Pagination =====
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;
  const [allPosts, setAllPosts] = useState([]);
  const [currentPosts, setCurrentPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // ===== Projects Pagination =====
  const [currentProjectPage, setCurrentProjectPage] = useState(1);
  const projectsPerPage = 5;
  const [allProjects, setAllProjects] = useState([]);
  const [currentProjects, setCurrentProjects] = useState([]);
  const [totalProjectPages, setTotalProjectPages] = useState(1);

  // ===== Users & Subscribers Pagination =====
  const [users, setUsers] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentSubPage, setCurrentSubPage] = useState(1);
  const usersPerPage = 5;
  const subsPerPage = 5;
  const [currentUsers, setCurrentUsers] = useState([]);
  const [currentSubs, setCurrentSubs] = useState([]);
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [totalSubPages, setTotalSubPages] = useState(1);

  // ===== Testimonials Pagination =====
  const [userTestimonials, setUserTestimonials] = useState([]);
  const [currentTestimonialPage, setCurrentTestimonialPage] = useState(1);
  const testimonialsPerPage = 5;
  const [currentTestimonials, setCurrentTestimonials] = useState([]);
  const [totalTestimonialPages, setTotalTestimonialPages] = useState(1);

  // ===== Dropdown & Chart State =====
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openPost, setOpenPost] = useState(false);
  const [openProject, setOpenProject] = useState(false);

  // ===== Fetch Footer =====
  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((configJson) => {
        setFooter(
          configJson.portfolio_config.footer || { copy: "", social_links: [] }
        );
      })
      .catch((err) => console.error("Error loading Portfolio config:", err));
  }, []);

  // ===== Fetch Status =====
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const posts = await fetchPosts();
        const projects = await fetchProjects();
        const usersData = await fetchUsers();
        const subscribersData = await fetchSubscribers();

        setStats({
          postsCount: posts.data ? posts.data.length : posts.length,
          projectsCount: projects.data ? projects.data.length : projects.length,
          usersCount: usersData.data ? usersData.data.length : usersData.length,
          subscribersCount: subscribersData.data
            ? subscribersData.data.length
            : subscribersData.length,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStatus();
  }, [allPosts, allProjects, users, subscribers]);

  // ===== Fetch Posts =====
  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const res = await fetchPosts();
        const postsWithCounts = res.data.map((post) => ({
          _id: post._id,
          title: post.title,
          views: post.views?.length || 0,
          likes: post.likes?.length || 0,
        }));
        setAllPosts(postsWithCounts);
        setTotalPages(Math.ceil(postsWithCounts.length / postsPerPage));
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      }
    };
    fetchAllPosts();
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    setCurrentPosts(allPosts.slice(startIndex, endIndex));
  }, [allPosts, currentPage]);

  // ===== Fetch Projects =====
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const res = await fetchProjects();
        const projectsWithCounts = res.data.map((project) => ({
          _id: project._id,
          title: project.title,
          views: project.views?.length || 0,
          likes: project.likes?.length || 0,
        }));
        setAllProjects(projectsWithCounts);
        setTotalProjectPages(
          Math.ceil(projectsWithCounts.length / projectsPerPage)
        );
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchAllProjects();
  }, []);

  useEffect(() => {
    const startIndex = (currentProjectPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    setCurrentProjects(allProjects.slice(startIndex, endIndex));
  }, [allProjects, currentProjectPage]);

  // ===== Calculate max interactions =====
  const maxPostInteraction = allPosts.length
    ? Math.max(...allPosts.map((p) => (p.views || 0) + (p.likes || 0)))
    : 0;

  const maxProjectInteraction = allProjects.length
    ? Math.max(...allProjects.map((p) => (p.views || 0) + (p.likes || 0)))
    : 0;

  // ===== Calculate total interaction for a post/project =====
  const calcInteraction = (item) => {
    return (item.views || 0) + (item.likes || 0);
  };

  // ===== Prepare chart data for Nivo Pie =====
  const prepareChartData = (item, maxInteraction) => {
    const interaction = calcInteraction(item);
    return [
      {
        id: "Interaction",
        value: interaction,
        color: "#4cafef", // for posts, you can override in chart component
      },
      {
        id: "Remaining",
        value: maxInteraction - interaction,
        color: "#e0e0e0",
      },
    ];
  };

  // ===== Fetch Users =====
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await fetchUsers();
        const usersData = res.data || res;
        setUsers(usersData);
        setTotalUserPages(Math.ceil(usersData.length / usersPerPage));
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const startIndex = (currentUserPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    setCurrentUsers(users.slice(startIndex, endIndex));
  }, [users, currentUserPage]);

  // ===== Fetch Subscribers =====
  useEffect(() => {
    const fetchAllSubscribers = async () => {
      try {
        const res = await fetchSubscribers();
        const subsData = res.data || res;
        setSubscribers(subsData);
        setTotalSubPages(Math.ceil(subsData.length / subsPerPage));
      } catch (err) {
        console.error("Failed to fetch subscribers:", err);
      }
    };
    fetchAllSubscribers();
  }, []);

  useEffect(() => {
    const startIndex = (currentSubPage - 1) * subsPerPage;
    const endIndex = startIndex + subsPerPage;
    setCurrentSubs(subscribers.slice(startIndex, endIndex));
  }, [subscribers, currentSubPage]);

  // ===== Fetch User Testimonials =====
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetchUserTestimonials();
        setUserTestimonials(res);
        setTotalTestimonialPages(Math.ceil(res.length / testimonialsPerPage));
      } catch (err) {
        console.error("Failed to fetch testimonials:", err);
      }
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const startIndex = (currentTestimonialPage - 1) * testimonialsPerPage;
    const endIndex = startIndex + testimonialsPerPage;
    setCurrentTestimonials(userTestimonials.slice(startIndex, endIndex));
  }, [userTestimonials, currentTestimonialPage]);

  // ===== Delete Post =====
  const handleDeletePost = (postId) => {
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to delete this post?",
      onConfirm: async () => {
        try {
          await deletePost(postId);

          const updatedPosts = allPosts.filter((post) => post._id !== postId);
          setAllPosts(updatedPosts);

          // Adjust pagination
          const totalPages = Math.ceil(updatedPosts.length / postsPerPage);
          const newPage = Math.min(currentPostPage, totalPages);

          setCurrentPosts(
            updatedPosts.slice(
              (newPage - 1) * postsPerPage,
              newPage * postsPerPage
            )
          );

          setStats((prev) => ({ ...prev, postsCount: updatedPosts.length }));
        } catch (err) {
          console.error("Failed to delete post:", err);
        } finally {
          setConfirmModal({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  // ===== Open Modal for Update Post =====
  const handleEditPost = async (postId) => {
    try {
      const res = await fetchPostById(postId);
      const post = res.data || res;
      // Pass post data to PostModal
      setEditingPost(post);
      setIsPostModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch post:", err);
      alert("Failed to load post for editing");
    }
  };

  // ===== Delete Project =====
  const handleDeleteProject = (projectId) => {
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to delete this project?",
      onConfirm: async () => {
        try {
          await deleteProject(projectId);

          const updatedProjects = allProjects.filter(
            (p) => p._id !== projectId
          );
          setAllProjects(updatedProjects);

          // Adjust pagination
          const totalPages = Math.ceil(
            updatedProjects.length / projectsPerPage
          );
          const newPage = Math.min(currentProjectPage, totalPages);

          setCurrentProjects(
            updatedProjects.slice(
              (newPage - 1) * projectsPerPage,
              newPage * projectsPerPage
            )
          );
          setStats((prev) => ({
            ...prev,
            projectsCount: updatedProjects.length,
          }));
        } catch (err) {
          console.error("Failed to delete project:", err);
        } finally {
          setConfirmModal({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  // ===== Open Modal for Update Project =====
  const handleEditProject = async (projectId) => {
    try {
      const res = await fetchProjectById(projectId);
      const project = res.data || res;
      setEditingProject(project); // create new state for editing project
      setIsProjectModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch project:", err);
      alert("Failed to load project for editing");
    }
  };

  // ===== Delete Subscriber =====
  const handleDeleteSub = (subscriberId) => {
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to remove this subscriber?",
      onConfirm: async () => {
        try {
          await deleteSubscriber(subscriberId);

          const updatedSubs = subscribers.filter((s) => s._id !== subscriberId);
          setSubscribers(updatedSubs);

          // Adjust pagination
          const totalPages = Math.ceil(updatedSubs.length / subsPerPage);
          const newPage = Math.min(currentSubPage, totalPages);

          setCurrentSubs(
            updatedSubs.slice(
              (newPage - 1) * subsPerPage,
              newPage * subsPerPage
            )
          );
          setStats((prev) => ({ ...prev, subsCount: updatedSubs.length }));
        } catch (err) {
          console.error("Failed to delete subscriber:", err);
        } finally {
          setConfirmModal({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  // ===== Delete User =====
  const handleDeleteUser = (userId) => {
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to remove this user?",
      onConfirm: async () => {
        try {
          await deleteUser(userId);

          const updatedUsers = users.filter((u) => u._id !== userId);
          setUsers(updatedUsers);

          // Adjust pagination
          const totalPages = Math.ceil(updatedUsers.length / usersPerPage);
          const newPage = Math.min(currentUserPage, totalPages);

          setCurrentUsers(
            updatedUsers.slice(
              (newPage - 1) * usersPerPage,
              newPage * usersPerPage
            )
          );
          setStats((prev) => ({ ...prev, usersCount: updatedUsers.length }));
        } catch (err) {
          console.error("Failed to delete user:", err);
        } finally {
          setConfirmModal({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  // ===== Delete Testimonial =====
  const handleDeleteTestimonial = (testimonialId) => {
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to delete this testimonial?",
      onConfirm: async () => {
        try {
          await deleteTestimonial(testimonialId);

          // Remove testimonial from state
          const updatedTestimonials = userTestimonials.filter(
            (t) => t._id !== testimonialId
          );
          setUserTestimonials(updatedTestimonials);

          // Update currentTestimonials for current page
          const startIndex = (currentTestimonialPage - 1) * testimonialsPerPage;
          const endIndex = startIndex + testimonialsPerPage;
          setCurrentTestimonials(
            updatedTestimonials.slice(startIndex, endIndex)
          );

          // Update total pages
          setTotalTestimonialPages(
            Math.ceil(updatedTestimonials.length / testimonialsPerPage)
          );

          // Update stats
          setStats((prev) => ({
            ...prev,
            testimonialsCount: updatedTestimonials.length,
          }));
        } catch (err) {
          console.error("Failed to delete testimonial:", err);
        } finally {
          setConfirmModal({ isOpen: false, message: "", onConfirm: null });
        }
      },
    });
  };

  // Refresh posts
  const refreshPosts = async () => {
    try {
      const res = await fetchPosts();
      const postsWithCounts = res.data.map((post) => ({
        _id: post._id,
        title: post.title,
        views: post.views?.length || 0,
        likes: post.likes?.length || 0,
      }));
      setAllPosts(postsWithCounts);
      setTotalPages(Math.ceil(postsWithCounts.length / postsPerPage));
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  // Refresh projects
  const refreshProjects = async () => {
    try {
      const res = await fetchProjects();
      const projectsWithCounts = res.data.map((project) => ({
        _id: project._id,
        title: project.title,
        views: project.views?.length || 0,
        likes: project.likes?.length || 0,
      }));
      setAllProjects(projectsWithCounts);
      setTotalProjectPages(
        Math.ceil(projectsWithCounts.length / projectsPerPage)
      );
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.homeDashboard}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.titleDashboard}>
              <h1 className={styles.title}>Welcome To Your Hub Center.</h1>
            </div>
            <div className={styles.subtitleDashboard}>
              <p className={styles.subtitle}>
                Every post starts with a thought. Create, manage, and monitor
                your blog’s journey — from draft to published masterpiece.
              </p>
            </div>
            <div className={styles.buttonsDashboard}>
              <button
                className={styles.addPost}
                onClick={() => setIsPostModalOpen(true)}
              >
                Add Post <i className="ri-add-line"></i>
              </button>
              <button
                className={styles.addProject}
                onClick={() => setIsProjectModalOpen(true)}
              >
                Add Project <i className="ri-add-line"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className={styles.dashboard}>
        <div className="container">
          <div className={styles.content}>
            {/* ===== Status Management ===== */}
            <div className={styles.status}>
              <div className={styles.statBox}>
                <h3 className={styles.titleBox}>Total Posts</h3>
                <p className={styles.dataBox}>{stats.postsCount}</p>
              </div>
              <div className={styles.statBox}>
                <h3 className={styles.titleBox}>Total Projects</h3>
                <p className={styles.dataBox}>{stats.projectsCount}</p>
              </div>
              <div className={styles.statBox}>
                <h3 className={styles.titleBox}>Subscribers</h3>
                <p className={styles.dataBox}>{stats.subscribersCount}</p>
              </div>
              <div className={styles.statBox}>
                <h3 className={styles.titleBox}>Users</h3>
                <p className={styles.dataBox}>{stats.usersCount}</p>
              </div>
            </div>

            {/* ===== Chart Posts Section ===== */}
            <section className={styles.postProgress}>
              <div className={styles.content}>
                <h3 className={styles.title}>Posts Interaction</h3>

                {/* Posts Dropdown */}
                <div className={styles.dropdown}>
                  <button
                    className={styles.dropdownButton}
                    onClick={() => setOpenPost(!openPost)}
                  >
                    {selectedPost?.title || "Select Post"}
                    <span>{openPost ? "▲" : "▼"}</span>
                  </button>
                  {openPost && (
                    <div className={styles.dropdownList}>
                      {allPosts.map((post) => (
                        <div
                          key={post._id}
                          className={`${styles.dropdownItem} ${
                            selectedPost?._id === post._id
                              ? styles.dropdownItemActive
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedPost(post);
                            setOpenPost(false);
                          }}
                        >
                          {post.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Posts Chart */}
                <div
                  className={styles.chartBox}
                  style={{
                    height: selectedPost ? 350 : 0,
                    transition: "height 0.3s ease",
                  }}
                >
                  {selectedPost && (
                    <ResponsivePie
                      data={prepareChartData(selectedPost, maxPostInteraction)}
                      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                      innerRadius={0.8}
                      padAngle={2}
                      cornerRadius={2}
                      activeOuterRadiusOffset={8}
                      colors={["rgb(17, 140, 255)", "rgb(251, 251, 254)"]}
                      borderWidth={2}
                      borderColor={{
                        from: "color",
                        modifiers: [["darker", 0.2]],
                      }}
                      enableArcLinkLabels={false}
                      enableArcLabels={false}
                      animate
                      motionConfig="wobbly"
                      tooltip={() => <></>}
                    />
                  )}
                </div>

                {/* Posts Percentage */}
                {selectedPost && (
                  <div className={styles.progressValue}>
                    {selectedPost.title}: (
                    {(
                      (calcInteraction(selectedPost) / maxPostInteraction) *
                      100
                    ).toFixed(1)}
                    %)
                  </div>
                )}
              </div>
            </section>

            {/* ===== Posts Management ===== */}
            <section className={styles.postsManagement}>
              <div className={styles.content}>
                <div className={styles.postsData}>
                  <h1 className={styles.postMTitle}>Post Management</h1>
                  {currentPosts.length > 0 ? (
                    currentPosts.map((post) => (
                      <div key={post._id} className={styles.postData}>
                        <h3 className={styles.title}>{post.title}</h3>
                        <span className={styles.views}>
                          {post.views} <i className="ri-eye-line"></i>
                        </span>
                        <span className={styles.likes}>
                          {post.likes} <i className="ri-heart-line"></i>
                        </span>
                        <div className={styles.buttons}>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleEditPost(post._id)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeletePost(post._id)}
                          >
                            Delete
                          </button>
                          <button
                            className={styles.viewBtn}
                            onClick={() => navigate(`/post/${post._id}`)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.postsNotFound}>No Projects found.</p>
                  )}
                </div>

                {/* Posts Pagination */}
                <div className={styles.postPagination}>
                  {currentPage > 1 && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`${styles.pageBtn} ${
                        currentPage === i + 1 ? styles.active : ""
                      }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {currentPage < totalPages && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ===== Chart Projects Section ===== */}
            <section className={styles.projectProgress}>
              <div className={styles.content}>
                <h3 className={styles.title}>Projects Interaction</h3>

                {/* Projects Dropdown */}
                <div className={styles.dropdown} style={{ marginTop: "20px" }}>
                  <button
                    className={styles.dropdownButton}
                    onClick={() => setOpenProject(!openProject)}
                  >
                    {selectedProject?.title || "Select Project"}
                    <span>{openProject ? "▲" : "▼"}</span>
                  </button>
                  {openProject && (
                    <div className={styles.dropdownList}>
                      {allProjects.map((project) => (
                        <div
                          key={project._id}
                          className={`${styles.dropdownItem} ${
                            selectedProject?._id === project._id
                              ? styles.dropdownItemActive
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedProject(project);
                            setOpenProject(false);
                          }}
                        >
                          {project.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects Chart */}
                <div
                  className={styles.chartBox}
                  style={{
                    height: selectedProject ? 350 : 0,
                    transition: "height 0.3s ease",
                  }}
                >
                  {selectedProject && (
                    <ResponsivePie
                      data={prepareChartData(
                        selectedProject,
                        maxProjectInteraction
                      )}
                      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                      innerRadius={0.8}
                      padAngle={2}
                      cornerRadius={2}
                      activeOuterRadiusOffset={8}
                      colors={["rgb(255, 84, 60)", "rgb(251, 251, 254)"]}
                      borderWidth={2}
                      borderColor={{
                        from: "color",
                        modifiers: [["darker", 0.2]],
                      }}
                      enableArcLinkLabels={false}
                      enableArcLabels={false}
                      animate
                      motionConfig="wobbly"
                      tooltip={() => <></>}
                    />
                  )}
                </div>

                {/* Projects Percentage */}
                {selectedProject && (
                  <div className={styles.progressValue}>
                    {selectedProject.title}: (
                    {(
                      (calcInteraction(selectedProject) /
                        maxProjectInteraction) *
                      100
                    ).toFixed(1)}
                    %)
                  </div>
                )}
              </div>
            </section>

            {/* ===== Projects Management ===== */}
            <section className={styles.projectsManagement}>
              <div className={styles.content}>
                <div className={styles.projectsData}>
                  <h1 className={styles.projectMTitle}>Project Management</h1>
                  {currentProjects.length > 0 ? (
                    currentProjects.map((project) => (
                      <div key={project._id} className={styles.projectData}>
                        <h3 className={styles.title}>{project.title}</h3>
                        <span className={styles.views}>
                          {project.views} <i className="ri-eye-line"></i>
                        </span>
                        <span className={styles.likes}>
                          {project.likes} <i className="ri-heart-line"></i>
                        </span>
                        <div className={styles.buttons}>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleEditProject(project._id)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteProject(project._id)}
                          >
                            Delete
                          </button>
                          <button
                            className={styles.viewBtn}
                            onClick={() => navigate(`/project/${project._id}`)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.projectsNotFound}>
                      No Projects found.
                    </p>
                  )}
                </div>

                {/* Projects Pagination */}
                <div className={styles.postPagination}>
                  {currentProjectPage > 1 && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentProjectPage((prev) => prev - 1)}
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                  )}
                  {Array.from({ length: totalProjectPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`${styles.pageBtn} ${
                        currentProjectPage === i + 1 ? styles.active : ""
                      }`}
                      onClick={() => setCurrentProjectPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {currentProjectPage < totalProjectPages && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentProjectPage((prev) => prev + 1)}
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ===== Subscribers ===== */}
            <section className={styles.subscribers}>
              <div className={styles.content}>
                <div className={styles.subscribesBox}>
                  <h2 className={styles.subscribeTitle}>Subscribers</h2>
                  {currentSubs.length > 0 ? (
                    currentSubs.map((sub) => (
                      <div key={sub._id} className={styles.subscribeData}>
                        <span className={styles.subscribeMail}>
                          {sub.email}
                        </span>
                        <span className={styles.subscribeDate}>
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </span>
                        <div className={styles.buttons}>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handleDeleteSub(sub._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.subscribersNotFound}>
                      No subscribers found.
                    </p>
                  )}
                </div>

                {/* Subscribers Pagination */}
                <div className={styles.subscribePagination}>
                  {currentSubPage > 1 && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentSubPage((prev) => prev - 1)}
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                  )}
                  {Array.from({ length: totalSubPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`${styles.pageBtn} ${
                        currentSubPage === i + 1 ? styles.active : ""
                      }`}
                      onClick={() => setCurrentSubPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {currentSubPage < totalSubPages && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentSubPage((prev) => prev + 1)}
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ===== Users ===== */}
            <section className={styles.users}>
              <div className={styles.content}>
                <div className={styles.usersBox}>
                  <h2 className={styles.userTitle}>Users</h2>
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <div key={user._id} className={styles.userData}>
                        <span className={styles.userMail}>{user.email}</span>
                        <div className={styles.buttons}>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.usersNotFound}>No users found.</p>
                  )}
                </div>

                {/* Users Pagination */}
                <div className={styles.userPagination}>
                  {currentUserPage > 1 && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentUserPage((prev) => prev - 1)}
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                  )}
                  {Array.from({ length: totalUserPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`${styles.pageBtn} ${
                        currentUserPage === i + 1 ? styles.active : ""
                      }`}
                      onClick={() => setCurrentUserPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {currentUserPage < totalUserPages && (
                    <button
                      className={styles.pageBtn}
                      onClick={() => setCurrentUserPage((prev) => prev + 1)}
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ===== Testimonials ===== */}
            <section className={styles.testimonials}>
              <div className={styles.content}>
                <div className={styles.testimonialsBox}>
                  <h2 className={styles.testimonialTitle}>User Testimonials</h2>

                  {/* Testimonials List */}
                  {currentTestimonials.length > 0 ? (
                    currentTestimonials.map((item, i) => (
                      <div key={i} className={styles.testimonialData}>
                        <div className={styles.testimonialHead}>
                          <div className={styles.clientInfo}>
                            <img
                              src={item.image || "/default-user.png"}
                              alt={item.nameclient}
                              className={styles.clientPhoto}
                            />
                            <div className={styles.nameJob}>
                              <h4 className={styles.clientName}>
                                {item.nameclient}
                              </h4>
                              <p className={styles.clientJob}>
                                {item.jobclient}
                              </p>
                            </div>
                          </div>

                          {/* Edit & Remove Buttons */}
                          <div className={styles.buttons}>
                            <button
                              className={styles.removeBtn}
                              onClick={() => {
                                handleDeleteTestimonial(item._id);
                                console.log("Clicked testimonial:", item._id);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Testimonial Text */}
                        <p className={styles.testimonialText}>
                          {item.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className={styles.testimonialNotFound}>
                      No testimonials submitted by users.
                    </p>
                  )}
                </div>

                {/* Pagination */}
                <div className={styles.testimonialPagination}>
                  {currentTestimonialPage > 1 && (
                    <button
                      className={styles.pageBtn}
                      onClick={() =>
                        setCurrentTestimonialPage((prev) => prev - 1)
                      }
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                  )}
                  {Array.from({ length: totalTestimonialPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`${styles.pageBtn} ${
                        currentTestimonialPage === i + 1 ? styles.active : ""
                      }`}
                      onClick={() => setCurrentTestimonialPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {currentTestimonialPage < totalTestimonialPages && (
                    <button
                      className={styles.pageBtn}
                      onClick={() =>
                        setCurrentTestimonialPage((prev) => prev + 1)
                      }
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.content}>
            <span className={styles.copy}>{footer.copy}</span>
            <div className={styles.media}>
              {footer.social_links.map((link, idx) => (
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

      {/* Modals */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setEditingPost(null);
          refreshPosts(); // <-- refresh after closing modal
        }}
        editingPost={editingPost}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
          refreshProjects(); // <-- refresh after closing modal
        }}
        editingProject={editingProject}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal({ isOpen: false, message: "", onConfirm: null })
        }
      />
    </>
  );
};

export default Dashboard;
