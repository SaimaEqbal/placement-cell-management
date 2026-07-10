import {
  createDriveSchema,
  updateDriveSchema,
  prefilterSchema,
  attendanceSchema,
  resultSchema,
  roundDateSchema,
} from "../lib/schema.js";

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

/** Purpose: validate a pre-filter removal body ({ reason }). */
export const validatePrefilter = (req, res, next) => {
  const result = prefilterSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

/** Purpose: validate an attendance body ({ present }). */
export const validateAttendance = (req, res, next) => {
  const result = attendanceSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

/** Purpose: validate a round result body ({ result, reason? }); reason required when REJECTED. */
export const validateResult = (req, res, next) => {
  const result = resultSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

/** Purpose: validate a round-date body ({ round_date }). */
export const validateRoundDate = (req, res, next) => {
  const result = roundDateSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};
