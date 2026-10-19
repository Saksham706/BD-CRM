import AppError from "../utils/AppError.js";

export const validateRequest = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new AppError("Invalid request data.", 400, "VALIDATION_ERROR"));
  }
  req[source] = result.data;
  next();
};
