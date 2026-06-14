import { updateCompanySchema } from "../lib/schema.js";
import { createCompanySchema } from "../lib/schema.js";

export const validateUpdateCompany = (
  req,
  res,
  next
) => {
  const result =
    updateCompanySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors:
        result.error.flatten().fieldErrors,
    });
  }

  // Prevent empty update requests
  if (
    Object.keys(result.data).length === 0
  ) {
    return res.status(400).json({
      message:
        "At least one field is required for update",
    });
  }

  req.body = result.data;

  next();
};

export const validateCreateCompany = (
  req,
  res,
  next
) => {
  const result =
    createCompanySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors:
        result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;

  next();
};