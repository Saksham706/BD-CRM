import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { summary } from "../controllers/dashboardController.js";
const r = Router();
r.use(authenticate);
r.get("/summary", requirePermission("dashboard.view"), summary);
export default r;
