import { Router } from "express";
import * as controller from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.use(authenticate, requireAdmin);
router.get("/users/pending", controller.pendingUsers);
router.patch("/users/:id/approve", controller.approveUser);
router.patch("/users/:id/reject", controller.rejectUser);
export default router;
