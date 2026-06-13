import { z } from "zod";

export const createStudentSchema = z.object({
  roll_no: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),

  branch: z.string().min(1),
  graduation_year: z.number().int(),
  cgpa: z.number().min(0).max(10),

  gender: z.string(),
  region: z.string(),
  religion: z.string(),

  date_of_birth: z.coerce.date(),

  active_backlogs: z.number().int().min(0),
  passive_backlogs: z.number().int().min(0),

  resume_url: z.string().url(),

  tenth_marksheet_url: z.string().url(),
  twelfth_marksheet_url: z.string().url(),
  last_sem_marksheet_url: z.string().url(),

  placement_status: z.enum([
    "unplaced",
    "shortlisted",
    "placed",
    "rejected"
  ])
});

export const updateStudentSchema = z.object({
  roll_no: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),

  branch: z.string().min(1).optional(),
  graduation_year: z.number().int().optional(),
  cgpa: z.number().min(0).max(10).optional(),

  gender: z.string().optional(),
  region: z.string().optional(),
  religion: z.string().optional(),

  date_of_birth: z.coerce.date().optional(),

  active_backlogs: z.number().int().min(0).optional(),
  passive_backlogs: z.number().int().min(0).optional(),

  resume_url: z.string().url().optional(),

  tenth_marksheet_url: z.string().url().optional(),
  twelfth_marksheet_url: z.string().url().optional(),
  last_sem_marksheet_url: z.string().url().optional(),

  placement_status: z.enum([
    "unplaced",
    "shortlisted",
    "placed",
    "rejected"
  ]).optional()
});

export const createTPCSchema = z.object({
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

