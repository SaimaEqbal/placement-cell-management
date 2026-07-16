import { z } from "zod";

// A single announcement attachment: a pasted Google Drive link with a human-
// readable name. file_name/file_url mirror the company_post_attachments columns
// (name / drive_url conceptually). No files are uploaded. Defined up here so both
// the drive-creation schema and the announcement schemas can share it.
const announcementAttachmentSchema = z.object({
  file_name: z.string().min(1, "Attachment name is required"),
  file_url: z.string().min(1, "Attachment Drive URL is required"),
});

// The announcement fields that may be created alongside a drive (Phase 2). The
// drive link itself is set server-side, never from this body.
const driveAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  attachments: z.array(announcementAttachmentSchema).optional().default([]),
});

// Placement students are in semesters 5-8; a student in semester n must have
// SPIs for every completed semester (1 .. n-1). sem1-sem4 are always required
// (n >= 5); sem5/sem6/sem7 become required at semester 6/7/8. Runs only when a
// semester value is present, so partial updates that omit it are unaffected.
const enforceSemesterSpis = (val, ctx) => {
  if (val.semester == null) return;
  for (let i = 1; i < val.semester; i++) {
    if (val[`sem${i}_spi`] == null) {
      ctx.addIssue({
        code: "custom",
        path: [`sem${i}_spi`],
        message: `Semester ${i} SPI is required for a semester ${val.semester} student.`,
      });
    }
  }
};

export const createStudentSchema = z.object({
  roll_no: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),

  branch: z.string().min(1),
  department: z.string().min(1),
  batch: z.number().int(),
  // cgpa is NOT accepted from clients - it is derived server-side from the SPIs
  // (see lib/cgpa.js). Do not add a cgpa field here.
  semester: z.number().int().min(5).max(8),

  gender: z.string(),
  region: z.string(),
  religion: z.string(),

  date_of_birth: z.coerce.date(),

  active_backlogs: z.number().int().min(0).optional(),
  passive_backlogs: z.number().int().min(0).optional(),

  tenth_percentage: z.number().min(0).max(100),
  twelfth_percentage: z.number().min(0).max(100),

  sem1_spi: z.number().min(0).max(10).optional(),
  sem2_spi: z.number().min(0).max(10).optional(),
  sem3_spi: z.number().min(0).max(10).optional(),
  sem4_spi: z.number().min(0).max(10).optional(),
  sem5_spi: z.number().min(0).max(10).optional(),
  sem6_spi: z.number().min(0).max(10).optional(),
  sem7_spi: z.number().min(0).max(10).optional(),
  sem8_spi: z.number().min(0).max(10).optional(),

  resume_url: z.string(),

  tenth_marksheet_url: z.string(),
  twelfth_marksheet_url: z.string(),
  last_sem_marksheet_url: z.string(),

  placement_status: z.enum([
    "unplaced",
    "shortlisted",
    "placed",
    "second_chance",
    "rejected"
  ]).optional()
}).superRefine(enforceSemesterSpis);

// Shared field shape for the partial-update flows. The cross-field SPI-
// completeness rule (enforceSemesterSpis) is applied per-schema below, because
// the self-service wizard saves semester and SPIs in SEPARATE requests and must
// not require all SPIs the moment the semester alone is saved.
const updateStudentShape = {
  roll_no: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),

  branch: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  batch: z.number().int().optional(),
  // cgpa is derived server-side (lib/cgpa.js); never accepted from clients.
  semester: z.number().int().min(5).max(8).optional(),

  gender: z.string().optional(),
  region: z.string().optional(),
  religion: z.string().optional(),

  date_of_birth: z.coerce.date().optional(),

  active_backlogs: z.number().int().min(0).optional(),
  passive_backlogs: z.number().int().min(0).optional(),

  tenth_percentage: z.number().min(0).max(100).optional(),
  twelfth_percentage: z.number().min(0).max(100).optional(),

  sem1_spi: z.number().min(0).max(10).optional(),
  sem2_spi: z.number().min(0).max(10).optional(),
  sem3_spi: z.number().min(0).max(10).optional(),
  sem4_spi: z.number().min(0).max(10).optional(),
  sem5_spi: z.number().min(0).max(10).optional(),
  sem6_spi: z.number().min(0).max(10).optional(),
  sem7_spi: z.number().min(0).max(10).optional(),
  sem8_spi: z.number().min(0).max(10).optional(),

  resume_url: z.string().optional(),

  tenth_marksheet_url: z.string().optional(),
  twelfth_marksheet_url: z.string().optional(),
  last_sem_marksheet_url: z.string().optional(),

  placement_status: z.enum([
    "unplaced",
    "shortlisted",
    "placed",
    "second_chance",
    "rejected"
  ]).optional()
};

// Admin all-at-once update: the whole record arrives in one request, so the
// cross-field SPI-completeness rule can run at the schema level.
export const updateStudentSchema = z
  .object(updateStudentShape)
  .superRefine(enforceSemesterSpis);

// The self-service "complete my profile" wizard saves one part at a time, so
// every field is optional AND the cross-field SPI rule is NOT applied here -
// semester (Course step) and SPIs (Academic step) arrive in separate requests.
// SPI completeness is enforced in the controller against the merged/stored
// semester (see upsertMyProfile). Present SPIs are still range-checked above.
export const updateMyProfileSchema = z.object(updateStudentShape);

export const createTPCSchema = z.object({
  user_id: z
    .string()
    .uuid("user_id must be a valid UUID"),

  name: z
    .string()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .email("Invalid email address"),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits"),

  department: z
    .string()
    .min(2, "Department is required"),

  branch: z
    .string()
    .min(1)
    .optional(),
});

export const updateTPCSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .optional(),

  email: z
    .email("Invalid email address")
    .optional(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .optional(),

  department: z
    .string()
    .min(2, "Department is required")
    .optional(),

  branch: z
    .string()
    .min(1)
    .optional(),
});

export const createCompanySchema = z.object({
  company_name: z
    .string()
    .min(2, "Company name is required"),

  industry: z
    .string()
    .min(2, "Industry is required"),

  description: z
    .string()
    .min(10, "Description is required").optional(),

  hr_name: z
    .string()
    .min(2, "HR name is required").optional(),

  hr_email: z
    .email("Invalid HR email").optional(),

  hr_phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits").optional(),
});

export const updateCompanySchema = z.object({
  company_name: z
    .string()
    .min(2, "Company name is required")
    .optional(),

  industry: z
    .string()
    .min(2, "Industry is required")
    .optional(),

  description: z
    .string()
    .min(10, "Description is required")
    .optional(),

  hr_name: z
    .string()
    .min(2, "HR name is required")
    .optional(),

  hr_email: z
    .email("Invalid HR email")
    .optional(),

  hr_phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .optional(),
});

export const createDriveSchema = z.object({
  company_id: z
    .number({
      required_error: "Company ID is required",
    })
    .int()
    .positive(),

  job_role: z
    .string()
    .min(2, "Job role is required").optional(),

  job_description: z
    .string()
    .min(10, "Job description is required").optional(),

  package_ctc: z
    .number({
      required_error: "Package CTC is required",
    })
    .positive().optional(),

  employment_type: z.enum([
    "FTE",
    "Internship",
    "Internship + PPO",
  ]),

  minimum_cgpa: z
    .number()
    .min(0)
    .max(10),

  // Optional: minimum SPI required in EVERY recorded semester (see driveController
  // eligibility). Blank/omitted = no throughout constraint.
  minimum_cgpa_throughout: z
    .number()
    .min(0)
    .max(10)
    .optional(),

  allowed_branches: z
    .array(z.string())
    .min(1, "At least one branch is required"),

  // Batches (student graduation years) this drive targets; at least one required.
  allowed_batches: z
    .array(z.number().int())
    .min(1, "At least one batch is required"),

  max_active_backlogs: z
    .number()
    .int()
    .min(0).optional(),

  max_passive_backlogs: z
    .number()
    .int()
    .min(0).optional(),

  number_of_rounds: z
    .number()
    .int()
    .min(0).optional(),

  // Optional: create an announcement for this drive in the same request. When
  // present, the drive and its announcement are created atomically (see
  // driveController.createDrive). Omit for a drive with no announcement.
  announcement: driveAnnouncementSchema.optional(),
});

export const updateDriveSchema = z
  .object({
    company_id: z.number().int().positive().optional(),

    job_role: z.string().min(2).optional(),

    job_description: z.string().min(10).optional(),

    package_ctc: z.number().positive().optional(),

    employment_type: z
      .enum([
        "FTE",
        "Internship",
        "Internship + PPO",
      ])
      .optional(),

    minimum_cgpa: z
      .number()
      .min(0)
      .max(10)
      .optional(),

    minimum_cgpa_throughout: z
      .number()
      .min(0)
      .max(10)
      .optional(),

    allowed_branches: z
      .array(z.string())
      .min(1)
      .optional(),

    allowed_batches: z
      .array(z.number().int())
      .min(1)
      .optional(),

    max_active_backlogs: z
      .number()
      .int()
      .min(0)
      .optional(),

    max_passive_backlogs: z
      .number()
      .int()
      .min(0)
      .optional(),

    number_of_rounds: z
      .number()
      .int()
      .min(0)
      .optional(),

    status: z
      .enum([
        "upcoming",
        "ongoing",
        "completed",
        "cancelled",
      ])
      .optional(),
  })
  .strict();

// --- Round-workflow action bodies -----------------------------------------
// Attendance is a simple present/absent toggle; the round is derived server-side.
export const attendanceSchema = z.object({
  present: z.boolean(),
});

// A round's date + optional name. round_date: "" or "TBD" clears it (stored
// NULL), otherwise a YYYY-MM-DD string. round_name is optional (blank => NULL,
// UI falls back to "Round N").
export const roundDateSchema = z.object({
  round_date: z.string(),
  round_name: z.string().optional(),
});

// Batch stage-finalize bodies. The checkbox workflow keeps decisions local until
// the stage is finalized, then commits the whole set at once: `removed`/`rejected`
// list the driveStudentIds being taken out, each with a mandatory reason. An empty
// list means everyone still active passes/clears the stage.
const roundDecisionSchema = z.object({
  // drive_students.drive_student_id is BIGSERIAL, which node-pg serialises as a
  // string, so the client sends it as a string - coerce it back to a number.
  driveStudentId: z.coerce.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(10, "A rejection/removal reason of at least 10 characters is required"),
});

export const prefilterFinalizeSchema = z.object({
  removed: z.array(roundDecisionSchema).optional().default([]),
});

export const roundResolveSchema = z.object({
  rejected: z.array(roundDecisionSchema).optional().default([]),
});

// The 'email' post type has been removed; every post is an announcement. When
// `attachments` is provided it is the COMPLETE set for the post (the controller
// replaces the post's attachments with exactly this list, in order). An optional
// `drive_id` links the announcement to a drive (Phase 2); the DB enforces one
// announcement per drive.
export const createCompanyPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  attachments: z.array(announcementAttachmentSchema).optional().default([]),
  drive_id: z.number().int().positive().optional(),
});

export const updateCompanyPostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  // Omit to leave attachments untouched; send [] to clear them all.
  attachments: z.array(announcementAttachmentSchema).optional(),
});