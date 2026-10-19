import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { history } from "../controllers/assignmentController.js";
const r = Router();
r.use(authenticate);
r.get("/:leadId/history", requirePermission("leads.view"), history);
export default r;
