import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as controller from "../controllers/importController.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    if (
      file.mimetype !== "text/csv" &&
      !file.originalname.toLowerCase().endsWith(".csv")
    )
      return cb(new Error("Only CSV files are accepted."));
    cb(null, true);
  },
});
const router = Router();
router.use(authenticate);
router.post(
  "/csv",
  requirePermission("imports.create"),
  upload.single("file"),
  controller.importCsv,
);
router.get("/", requirePermission("imports.view"), controller.history);
export default router;
