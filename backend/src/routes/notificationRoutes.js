import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as controller from "../controllers/notificationController.js";
const router = Router();
router.use(authenticate);
router.get("/", controller.list);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);
export default router;
