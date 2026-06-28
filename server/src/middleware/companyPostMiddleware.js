import { createCompanyPostSchema,updateCompanyPostSchema } from "../lib/schema.js";

export const validateCreateCompanyPost = (req, res, next) => {
  try {
    createCompanyPostSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json(error);
  }
};

export const validateUpdateCompanyPost = (req, res, next) => {
  try {
    updateCompanyPostSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json(error);
  }
};