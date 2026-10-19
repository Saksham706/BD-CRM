import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();
router.post("/register", authLimiter, controller.register);
router.post("/verify-email", authLimiter, controller.verifyEmail);
router.post("/resend-verification", authLimiter, controller.resendVerification);
router.post("/login", authLimiter, controller.login);
router.post("/refresh", authLimiter, controller.refresh);
router.post("/logout", authenticate, controller.logout);
router.post("/forgot-password", authLimiter, controller.forgotPassword);
router.post("/reset-password", authLimiter, controller.resetPassword);
router.get("/me", authenticate, controller.me);
export default router;
