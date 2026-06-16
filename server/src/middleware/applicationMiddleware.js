import { applyForDriveSchema } from "../lib/schema.js";

export const validateApplyForDrive = (
  req,
  res,
  next
) => {
  const result =
    applyForDriveSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors:
        result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};