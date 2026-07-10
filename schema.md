## Table `students`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `roll_no` | `varchar` |  Unique |
| `name` | `varchar` |  |
| `email` | `varchar` |  Unique |
| `phone` | `varchar` |  Nullable |
| `branch` | `varchar` |  Nullable |
| `graduation_year` | `int4` |  Nullable |
| `cgpa` | `numeric` |  Nullable |
| `placement_status` | `varchar` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `gender` | `varchar` |  Nullable |
| `region` | `varchar` |  Nullable |
| `religion` | `varchar` |  Nullable |
| `date_of_birth` | `date` |  Nullable |
| `active_backlogs` | `int4` |  Nullable |
| `passive_backlogs` | `int4` |  Nullable |
| `resume_url` | `text` |  Nullable |
| `tenth_marksheet_url` | `text` |  Nullable |
| `twelfth_marksheet_url` | `text` |  Nullable |
| `last_sem_marksheet_url` | `text` |  Nullable |
| `review_status` | `varchar` |  Nullable |
| `reviewed_at` | `timestamptz` |  Nullable |
| `user_id` | `uuid` |  Nullable Unique |
| `department` | `varchar` |  Nullable |
| `tenth_percentage` | `numeric` |  Nullable |
| `twelfth_percentage` | `numeric` |  Nullable |
| `sem1_spi` | `numeric` |  Nullable |
| `sem2_spi` | `numeric` |  Nullable |
| `sem3_spi` | `numeric` |  Nullable |
| `sem4_spi` | `numeric` |  Nullable |
| `sem5_spi` | `numeric` |  Nullable |
| `sem6_spi` | `numeric` |  Nullable |
| `sem7_spi` | `numeric` |  Nullable |
| `sem8_spi` | `numeric` |  Nullable |
| `semester` | `int4` |  Nullable |
| `is_profile_complete` | `bool` |  Nullable |
| `rejection_reason` | `text` |  Nullable |
| `assigned_spc_id` | `int4` |  Nullable |

## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `varchar` |  Unique |
| `password_hash` | `text` |  |
| `role` | `varchar` |  |
| `is_verified` | `bool` |  |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |

## Table `tpc`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `tpc_id` | `int4` | Primary |
| `user_id` | `uuid` |  Unique |
| `name` | `varchar` |  |
| `email` | `varchar` |  Unique |
| `phone` | `varchar` |  |
| `branch` | `varchar` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `department` | `varchar` |  Nullable |

## Table `spc`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `spc_id` | `int4` | Primary |
| `user_id` | `uuid` |  Unique |
| `name` | `varchar` |  |
| `email` | `varchar` |  Unique |
| `phone` | `varchar` |  |
| `department` | `varchar` |  |
| `created_at` | `timestamp` |  Nullable |
| `branch` | `varchar` |  Nullable |

## Table `companies`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `company_id` | `int4` | Primary |
| `company_name` | `varchar` |  |
| `industry` | `varchar` |  Nullable |
| `description` | `text` |  Nullable |
| `hr_name` | `varchar` |  Nullable |
| `hr_email` | `varchar` |  Nullable |
| `hr_phone` | `varchar` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  Nullable |

## Table `drives`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `drive_id` | `int4` | Primary |
| `company_id` | `int4` |  |
| `job_role` | `varchar` |  Nullable |
| `job_description` | `text` |  Nullable |
| `package_ctc` | `numeric` |  Nullable |
| `employment_type` | `varchar` |  |
| `minimum_cgpa` | `numeric` |  |
| `allowed_branches` | `_text` |  |
| `max_active_backlogs` | `int4` |  Nullable |
| `max_passive_backlogs` | `int4` |  Nullable |
| `number_of_rounds` | `int4` |  Nullable |
| `status` | `varchar` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `current_round` | `int4` |  Nullable |
| `drive_state` | `varchar` |  Nullable |
| `round_stage` | `varchar` |  Nullable |
| `is_locked` | `bool` |  Nullable |

## Table `drive_rounds`

Per-round metadata (currently the round's date). One row per round; created when a
round opens, `round_date` NULL = TBD. Cascades on drive delete.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `drive_id` | `int4` | PK, FK → drives(drive_id) ON DELETE CASCADE |
| `round_no` | `int4` | PK |
| `round_date` | `date` |  Nullable (NULL = TBD) |
| `created_at` | `timestamptz` |  Nullable |

## Table `applications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `application_id` | `int4` | Primary |
| `student_id` | `int4` |  |
| `drive_id` | `int4` |  |
| `current_round` | `int4` |  Nullable |
| `status` | `varchar` |  |
| `applied_at` | `timestamptz` |  Nullable |

## Table `invitations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `invitation_id` | `int4` | Primary |
| `email` | `varchar` |  Unique |
| `role` | `varchar` |  |
| `token` | `uuid` |  Unique |
| `accepted` | `bool` |  Nullable |
| `expires_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `company_posts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `post_id` | `int8` | Primary |
| `title` | `varchar` |  |
| `post_type` | `varchar` |  Nullable |
| `content` | `text` |  |
| `posted_by` | `uuid` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `company_post_attachments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `attachment_id` | `int8` | Primary |
| `post_id` | `int8` |  |
| `file_name` | `varchar` |  Nullable |
| `mime_type` | `varchar` |  Nullable |
| `file_url` | `text` |  |
| `uploaded_at` | `timestamptz` |  Nullable |

## Table `notifications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `user_id` | `uuid` |  |
| `title` | `varchar` |  |
| `message` | `text` |  |
| `tone` | `varchar` |  |
| `read` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `drive_students`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `drive_student_id` | `int8` | Primary |
| `drive_id` | `int8` |  |
| `student_id` | `int8` |  |
| `status` | `varchar` |  Nullable |
| `current_round` | `int4` |  Nullable |
| `remarks` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `added_by` | `uuid` |  Nullable |
| `attendance_mark` | `varchar` |  Nullable |

## Table `drive_round_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `history_id` | `int8` | Primary |
| `drive_id` | `int4` |  |
| `student_id` | `int8` |  |
| `round_no` | `int4` |  |
| `stage` | `varchar` |  |
| `result` | `varchar` |  |
| `reason` | `text` |  Nullable |
| `recorded_by` | `uuid` |  Nullable |
| `recorded_at` | `timestamptz` |  Nullable |

