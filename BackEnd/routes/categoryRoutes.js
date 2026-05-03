import express from "express";
import { createCategory, fetchCategories } from "../controllers/categoryController.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", fetchCategories);

export default router;