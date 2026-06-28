import { z } from "zod";

export const createStudentSchema = z.object({
  roll_no: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),

  branch: z.string().min(1),
  department: z.string().min(1),
  graduation_year: z.number().int(),
  cgpa: z.number().min(0).max(10),

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
    "rejected"
  ]).optional()
});

export const updateStudentSchema = z.object({
  roll_no: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),

  branch: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  graduation_year: z.number().int().optional(),
  cgpa: z.number().min(0).max(10).optional(),

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
    "rejected"
  ]).optional()
});

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

  branch: z
    .string()
    .min(2, "Branch is required"),
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

  branch: z
    .string()
    .min(2, "Branch is required")
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

  drive_date: z.string(),

  application_deadline: z.string(),

  minimum_cgpa: z
    .number()
    .min(0)
    .max(10),

  allowed_branches: z
    .array(z.string())
    .min(1, "At least one branch is required"),

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
    .positive().optional(),
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

    drive_date: z.string().optional(),

    application_deadline: z.string().optional(),

    minimum_cgpa: z
      .number()
      .min(0)
      .max(10)
      .optional(),

    allowed_branches: z
      .array(z.string())
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
      .positive()
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

export const applyForDriveSchema = z.object({
  student_id: z
    .number()
    .int()
    .positive(),
});

export const updateStudentRoundSchema = z.object({
  current_round: z
    .number()
    .int()
    .min(0),
});

export const createCompanyPostSchema = z.object({
  title: z.string().min(1),
  post_type: z.enum(["announcement", "email"]).optional(),
  content: z.string().min(1),
});

export const updateCompanyPostSchema = createCompanyPostSchema.partial();