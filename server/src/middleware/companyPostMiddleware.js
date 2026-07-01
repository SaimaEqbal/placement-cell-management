import { createCompanyPostSchema, updateCompanyPostSchema } from "../lib/schema.js";

/**
 * Validate the POST /company-post body against createCompanyPostSchema,
 * returning field-level errors in the shared `{ errors: { field: [msgs] } }`
 * shape the frontend's toApiError understands.
 */
export const validateCreateCompanyPost = (req, res, next) => {
  const result = createCompanyPostSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

/** Validate the PUT /company-post/:postId body against updateCompanyPostSchema. */
export const validateUpdateCompanyPost = (req, res, next) => {
  const result = updateCompanyPostSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};
