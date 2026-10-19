import { Router } from "express";
import { listPermissions } from "../controllers/permissionController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.get("/", authenticate, requireAdmin, listPermissions);
export default router;
