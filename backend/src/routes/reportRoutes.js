import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as controller from "../controllers/reportController.js";
const router=Router();router.use(authenticate);router.get("/summary",requirePermission("reports.view"),controller.summary);router.get("/leads/export",requirePermission("exports.create"),controller.exportLeads);export default router;
