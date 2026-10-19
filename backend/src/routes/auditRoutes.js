import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { list } from "../controllers/auditController.js";
const router=Router();router.use(authenticate);router.get("/",requirePermission("audit.view"),list);export default router;
