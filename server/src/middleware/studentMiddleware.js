import { createStudentSchema } from "../lib/schema.js";
import { updateStudentSchema } from "../lib/schema.js";
import { updateMyProfileSchema } from "../lib/schema.js";

export const validateCreateStudent = (req, res, next) => {
  try {
    req.body = createStudentSchema.parse(req.body);
    next();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      success: false,
      errors: err.issues
    });
  }
};

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

// Self-service wizard save. Zod strips unknown keys (e.g. a client-sent cgpa),
// so only allowlisted profile fields survive into req.body.
export const validateUpdateMyProfile = (req, res, next) => {
  try {
    req.body = updateMyProfileSchema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      errors: err.issues
    });
  }
};