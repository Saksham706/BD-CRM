export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || (err.name === "ZodError" ? 400 : 500);
  if (status >= 500) console.error(err);
  const message = status >= 500 && process.env.NODE_ENV === "production"
    ? "An unexpected error occurred."
    : err.message || "Request failed.";
  return res.status(status).json({
    success: false,
    message,
    code: err.code || (err.name === "ZodError" ? "VALIDATION_ERROR" : "INTERNAL_ERROR"),
    ...(process.env.NODE_ENV !== "production" && err.name === "ZodError"
      ? { issues: err.issues?.map((i) => ({ path: i.path, message: i.message })) }
      : {})
  });
}
