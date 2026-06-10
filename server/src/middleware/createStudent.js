import { createStudentSchema } from "../lib/schema.js";

export const validateCreateStudent = (req, res, next) => {
  try {
    req.body = createStudentSchema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      errors: err.issues
    });
  }
};