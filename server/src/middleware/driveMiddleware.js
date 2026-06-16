import { createDriveSchema } from "../lib/schema.js";
import { updateDriveSchema } from "../lib/schema.js";
import { updateStudentRoundSchema } from "../lib/schema.js";

export const validateCreateDrive = (
  req,
  res,
  next
) => {
  const result =
    createDriveSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors:
        result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;

  next();
};

export const validateUpdateDrive = (
  req,
  res,
  next
) => {
  const result =
    updateDriveSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors:
        result.error.flatten().fieldErrors,
    });
  }

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

export const validateUpdateStudentRound = (
  req,
  res,
  next
) => {
  const result =
    updateStudentRoundSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors:
        result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};