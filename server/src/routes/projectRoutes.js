import express from "express";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject
} from "../controllers/projectController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require login
router.use(protect);

// All logged-in roles can view projects
router.get("/", getProjects);

// Only Admin and Project Manager can create projects
router.post(
  "/",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  createProject
);

// Only Admin and Project Manager can update projects
router.put(
  "/:id",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  updateProject
);

// Only Admin and Project Manager can delete projects
router.delete(
  "/:id",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  deleteProject
);

export default router;