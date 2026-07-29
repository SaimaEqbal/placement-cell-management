import {
  createDriveSchema,
  updateDriveSchema,
  attendanceSchema,
  roundDateSchema,
  prefilterFinalizeSchema,
  roundResolveSchema,
  completeDriveSchema,
  offerTakenSchema,
  withdrawalSchema,
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

/** Purpose: validate a pre-filter finalize body ({ removed: [{ driveStudentId, reason }] }). */
export const validatePrefilterFinalize = (req, res, next) => {
  const result = prefilterFinalizeSchema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  req.body = result.data;
  next();
};

/** Purpose: validate a round-resolve body ({ rejected: [{ driveStudentId, reason }] }) for advance-round. */
export const validateRoundResolve = (req, res, next) => {
  const result = roundResolveSchema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  req.body = result.data;
  next();
};

/** Purpose: validate a complete-drive body ({ rejected: [...], placed: [{ driveStudentId, final_role?, final_package? }] }). */
export const validateCompleteDrive = (req, res, next) => {
  const result = completeDriveSchema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  req.body = result.data;
  next();
};

/** Purpose: validate an offer-taken toggle body ({ taken: boolean }). */
export const validateOfferTaken = (req, res, next) => {
  const result = offerTakenSchema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  req.body = result.data;
  next();
};

/** Purpose: validate a withdrawal toggle body ({ withdraw: boolean }). */
export const validateWithdrawal = (req, res, next) => {
  const result = withdrawalSchema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  req.body = result.data;
  next();
};
