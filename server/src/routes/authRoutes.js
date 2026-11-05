import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser,
  loginUser
} from "../controllers/authController.js";
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again after 15 minutes."
  }
});
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
export default router;