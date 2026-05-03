import express from "express";
import { createProject, fetchProjects, getProjectById, toggleProjectLike, addProjectView, updateProject, deleteProject, getRelatedProjects } from "../controllers/projectController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(fetchProjects).post(verifyToken, createProject);

// Get related projects by category (exclude current project)
router.get("/related/:categoryId/:currentProjectId", getRelatedProjects);

router.route("/:id").get(getProjectById).put(verifyToken, updateProject).delete(verifyToken, deleteProject);

router.post("/:id/like", verifyToken, toggleProjectLike);
router.post("/:id/view", verifyToken, addProjectView);

export default router;