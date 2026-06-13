import {
  createTPCSchema,
  updateTPCSchema,
} from "../lib/schema.js";

export const validateCreateTPC = (req, res, next) => {
  const result = createTPCSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

export const validateUpdateTPC = (req, res, next) => {
  const result = updateTPCSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};