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

export const updateStudentSchema = createStudentSchema;