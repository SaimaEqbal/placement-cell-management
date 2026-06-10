import { updateStudentSchema } from "../lib/schema.js";

export const validateUpdateStudent = (req, res, next) => {
  try {
    req.body = updateStudentSchema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      errors: err.issues
    });
  }
};