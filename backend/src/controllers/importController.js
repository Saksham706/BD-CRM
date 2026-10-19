import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import ImportJob from "../models/ImportJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import { writeAudit } from "../services/auditService.js";
import { recordActivity } from "../services/activityService.js";

export const importCsv = asyncHandler(async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({
        success: false,
        message: "Upload a CSV file in the 'file' field.",
      });
  if (req.file.size > 5 * 1024 * 1024)
    return res
      .status(413)
      .json({ success: false, message: "CSV file must be 5 MB or smaller." });
  const job = await ImportJob.create({
    createdBy: req.user._id,
    originalName: req.file.originalname,
    status: "processing",
  });
  try {
    const rows = parse(req.file.buffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false,
    });
    if (rows.length > 5000) {
      job.status = "failed";
      job.errors = [{ row: 0, message: "Maximum 5,000 rows per upload." }];
      job.completedAt = new Date();
      await job.save();
      return res
        .status(413)
        .json({ success: false, message: "Maximum 5,000 rows per upload." });
    }
    job.totalRows = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const displayName = String(
        r.displayName || [r.firstName, r.lastName].filter(Boolean).join(" "),
      ).trim();
      if (!displayName) {
        job.failedRows++;
        job.errors.push({
          row: i + 2,
          message: "displayName or firstName is required.",
        });
        continue;
      }
      try {
        const lead = await Lead.create({
          leadCode: `LD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          displayName,
          firstName: r.firstName || "",
          lastName: r.lastName || "",
          email: r.email || "",
          phone: r.phone || "",
          company: r.company || "",
          source: r.source || "CSV Import",
          status: r.status || "New",
          priority: r.priority || "Medium",
          description: r.description || "",
          customFields: {},
          ownerId: req.user._id,
          createdBy: req.user._id,
        });
        await recordActivity({
          leadId: lead._id,
          actorId: req.user._id,
          eventType: "lead.imported",
          summary: "Lead imported from CSV",
          payload: { importJobId: String(job._id), row: i + 2 },
        });
        job.importedRows++;
      } catch (e) {
        job.failedRows++;
        job.errors.push({ row: i + 2, message: e.message.slice(0, 300) });
      }
    }
    job.status = job.failedRows
      ? job.importedRows
        ? "completed_with_errors"
        : "failed"
      : "completed";
    job.completedAt = new Date();
    await job.save();
    await writeAudit(req, {
      action: "leads.imported",
      targetType: "ImportJob",
      targetId: job._id,
      metadata: {
        totalRows: job.totalRows,
        importedRows: job.importedRows,
        failedRows: job.failedRows,
      },
    });
    return success(
      res,
      "CSV import processed",
      job,
      job.importedRows ? 201 : 400,
    );
  } catch (e) {
    job.status = "failed";
    job.completedAt = new Date();
    job.errors.push({ row: 0, message: e.message.slice(0, 300) });
    await job.save();
    throw e;
  }
});
export const history = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1),
    limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter =
    req.user.accountType === "admin" ? {} : { createdBy: req.user._id };
  const [items, total] = await Promise.all([
    ImportJob.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ImportJob.countDocuments(filter),
  ]);
  return success(res, "Import history retrieved", {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
