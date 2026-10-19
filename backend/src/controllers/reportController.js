import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { success } from "../utils/apiResponse.js";
import {
  getDashboardSummary,
  getAuthorizedLeadRows,
} from "../services/reportService.js";
import ReportExport from "../models/ReportExport.js";
import { writeAudit } from "../services/auditService.js";

export const summary = asyncHandler(async (req, res) =>
  success(
    res,
    "Dashboard summary retrieved",
    await getDashboardSummary(req.user, req.query),
  ),
);
export const exportLeads = asyncHandler(async (req, res) => {
  const format = String(req.query.format || "csv").toLowerCase();
  if (!["csv", "xlsx", "pdf"].includes(format))
    return res
      .status(400)
      .json({ success: false, message: "format must be csv, xlsx, or pdf" });
  const rows = await getAuthorizedLeadRows(req.user, req.query);
  const normalized = rows.map((l) => ({
    leadCode: l.leadCode,
    displayName: l.displayName,
    email: l.email,
    phone: l.phone,
    company: l.company,
    source: l.source,
    status: l.status,
    priority: l.priority,
    owner: l.ownerId?.fullName || "",
    createdBy: l.createdBy?.fullName || "",
    createdAt: l.createdAt,
  }));
  const record = await ReportExport.create({
    createdBy: req.user._id,
    format,
    reportType: "leads",
    filters: {
      status: req.query.status || null,
      source: req.query.source || null,
      from: req.query.from || null,
      to: req.query.to || null,
    },
    rowCount: normalized.length,
    status: "completed",
  });
  await writeAudit(req, {
    action: "report.exported",
    targetType: "ReportExport",
    targetId: record._id,
    metadata: { format, rowCount: normalized.length },
  });
  const filename = `crm-leads-${new Date().toISOString().slice(0, 10)}.${format}`;
  if (format === "csv") {
    const headers = Object.keys(
      normalized[0] || {
        leadCode: "",
        displayName: "",
        email: "",
        phone: "",
        company: "",
        source: "",
        status: "",
        priority: "",
        owner: "",
        createdBy: "",
        createdAt: "",
      },
    );
    const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [
      headers.map(escape).join(","),
      ...normalized.map((row) =>
        headers
          .map((k) =>
            escape(row[k] instanceof Date ? row[k].toISOString() : row[k]),
          )
          .join(","),
      ),
    ].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  }
  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");
    sheet.columns = Object.keys(
      normalized[0] || {
        leadCode: "",
        displayName: "",
        email: "",
        phone: "",
        company: "",
        source: "",
        status: "",
        priority: "",
        owner: "",
        createdBy: "",
        createdAt: "",
      },
    ).map((key) => ({
      header: key,
      key,
      width: Math.min(30, Math.max(14, key.length + 3)),
    }));
    sheet.addRows(
      normalized.map((row) => ({
        ...row,
        createdAt: row.createdAt ? new Date(row.createdAt) : null,
      })),
    );
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = {
      from: "A1",
      to: { row: 1, column: sheet.columns.length },
    };
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    return res.end();
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ size: "A4", margin: 36, layout: "landscape" });
  doc.pipe(res);
  doc.fontSize(16).text("Lead Management CRM — Leads Export");
  doc
    .moveDown(0.4)
    .fontSize(8)
    .text(
      `Generated: ${new Date().toISOString()} | Records: ${normalized.length}`,
    );
  doc.moveDown();
  for (const row of normalized) {
    doc
      .fontSize(8)
      .text(
        `${row.leadCode || ""} | ${row.displayName} | ${row.company} | ${row.status} | ${row.priority} | ${row.owner}`,
      );
    if (doc.y > 520) doc.addPage();
  }
  doc.end();
});
