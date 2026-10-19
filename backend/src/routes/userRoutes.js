import { Router } from "express";
import * as controller from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.use(authenticate, requireAdmin);
router.get("/", controller.listUsers);
router.post("/", controller.createUser);
router.patch("/:id", controller.updateUser);
router.patch("/:id/status", controller.setStatus);
router.get("/:id/permissions", controller.getPermissions);
router.put("/:id/permissions", controller.setPermissions);
export default router;
