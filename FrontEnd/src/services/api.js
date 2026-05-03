import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Attach token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (import.meta.env.DEV) {
      console.error("API Error:", message);
    }

    if (status === 401) {
      console.warn("Unauthorized access - no token or invalid token.");
    }

    if (status === 401) {
      return Promise.resolve({ data: [] });
    }

    return Promise.reject(error);
  }
);

// ------------------ Posts ------------------
export const createPost = async (data) => api.post("/posts", data);
export const fetchPosts = async () => api.get("/posts");
export const fetchPostById = async (id) => api.get(`/posts/${id}`);

// ------------------ Related Posts ------------------
export const fetchPostsByCategory = async (categoryId, excludePostId = null) => {
  try {
    const url = excludePostId
      ? `/posts/category/${categoryId}?exclude=${excludePostId}`
      : `/posts/category/${categoryId}`;

    const res = await api.get(url);
    return res.data;
  } catch (err) {
    console.error("Fetch posts by category error:", err.response?.data || err.message);
    return [];
  }
};

export const likePost = (id, token) =>
  axios.post(
    `${import.meta.env.VITE_API_URL}/posts/${id}/like`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
export const viewPost = (id, token) =>
  axios.post(
    `${import.meta.env.VITE_API_URL}/posts/${id}/view`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

// New: Update Post
export const updatePost = async (id, data) => api.put(`/posts/${id}`, data);

// New: Delete Post
export const deletePost = async (id) => api.delete(`/posts/${id}`);

// ------------------ Projects ------------------
export const createProject = async (data) => api.post("/projects", data);
export const fetchProjects = async () => api.get("/projects");
export const fetchProjectById = async (id) => api.get(`/projects/${id}`);

export const fetchProjectsByCategory = async (categoryId, currentProjectId) => {
  const res = await api.get(`/projects/related/${categoryId}/${currentProjectId}`);
  return res.data;
};

export const likeProject = (id, token) =>
  axios.post(
    `${import.meta.env.VITE_API_URL}/projects/${id}/like`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
export const viewProject = (id, token) =>
  axios.post(
    `${import.meta.env.VITE_API_URL}/projects/${id}/view`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

// New: Update Project
export const updateProject = async (id, data) => api.put(`/projects/${id}`, data);

// New: Delete Project
export const deleteProject = async (id) => api.delete(`/projects/${id}`);

// ------------------ Uploads ------------------
export const uploadPostImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/upload/post", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadFroalaImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload/froala", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadProjectImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/upload/project", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ------------------ Categories ------------------
export const createPostCategory = async (name) =>
  api.post("/categories", { name, type: "post" });
export const fetchPostCategories = async () =>
  api.get("/categories", { params: { type: "post" } });
export const createProjectCategory = async (name) =>
  api.post("/categories", { name, type: "project" });
export const fetchProjectCategories = async () =>
  api.get("/categories", { params: { type: "project" } });

// ------------------ Comments ------------------
export const fetchCommentsByPost = async (postId) => {
  try {
    const res = await api.get(`/comments/${postId}`);
    return res.data;
  } catch (err) {
    console.error("Fetch comments error:", err.response?.data || err.message);
    return [];
  }
};

export const addComment = async (postId, { fullName, job, message }) => {
  try {
    const res = await api.post(
      `/comments/${postId}`,
      { fullName, job, message },
      { withCredentials: true }
    );
    return res.data;
  } catch (err) {
    console.error("Add comment error:", err.response?.data || err.message);
    throw err;
  }
};

export const addReply = async (commentId, message) => {
  try {
    const res = await api.post(
      `/comments/${commentId}/reply`,
      { message },
      { withCredentials: true }
    );
    return res.data;
  } catch (err) {
    console.error("Add reply error:", err.response?.data || err.message);
    throw err;
  }
};

// ------------------ Testimonials ------------------
export const uploadTestimonialImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post("/upload/testimonial", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const addTestimonial = async (projectId, data) => {
  const res = await api.post(`/testimonials/${projectId}`, data, {
    withCredentials: true,
  });
  return res.data;
};

export const fetchTestimonialsByProject = async (projectId) => {
  const res = await api.get(`/testimonials/${projectId}`);
  return res.data;
};

// Reply to testimonial (admin only)
export const addReplyTestimonial = async (testimonialId, message) => {
  const res = await api.post(
    `/testimonials/${testimonialId}/reply`,
    { message },
    { withCredentials: true }
  );
  return res.data;
};

// Fetch all user-submitted testimonials
export const fetchUserTestimonials = async () => {
  try {
    const res = await api.get("/testimonials/users/all");
    return res.data;
  } catch (err) {
    console.error(
      "Fetch user testimonials error:",
      err.response?.data || err.message
    );
    return [];
  }
};

// Delete testimonial (admin only)
export const deleteTestimonial = async (testimonialId, token) => {
  try {
    const res = await api.delete(`/testimonials/${testimonialId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Delete testimonial error:", err.response?.data || err.message);
    throw err;
  }
};

// ------------------ Subscribers ------------------
export const fetchSubscribers = async () => {
  try {
    const res = await api.get("/subscribers");
    return res.data; // ensure we always return the array
  } catch (err) {
    console.error("Fetch subscribers error:", err.response?.data || err.message);
    return [];
  }
};

// Delete subscriber (no token required)
export const deleteSubscriber = async (subscriberId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/subscribers/${subscriberId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete subscriber");
  }

  return await res.json();
};

// ------------------ Users ------------------
export const fetchUsers = async (token) => {
  try {
    const res = await api.get("/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Fetch users error:", err.response?.data || err.message);
    return [];
  }
};

// Delete user (admin only)
export const deleteUser = async (userId, token) => {
  try {
    const res = await api.delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Delete user error:", err.response?.data || err.message);
    throw err;
  }
};

export default api;