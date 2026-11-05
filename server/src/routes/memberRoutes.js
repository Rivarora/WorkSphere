import express from "express";

import {
  addProjectMember,
  getAllMembers,
  removeProjectMember
} from "../controllers/memberController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// View members
router.get("/members", getAllMembers);

// Add a member
router.post("/:projectId/members", addProjectMember);

// Remove a member
router.delete("/:projectId/members/:userId", removeProjectMember);

export default router;