/**
 * Map a PostgreSQL driver error to a meaningful HTTP status + message.
 *
 * The controllers' generic `500 "Failed to ..."` responses hid the real cause
 * (a missing table, a duplicate value, a broken foreign key). This translates
 * the common Postgres SQLSTATE codes into a status + message the client can act
 * on, falling back to the caller-supplied message for anything unrecognised.
 */
export function pgErrorResponse(error, fallback = "Internal server error") {
  switch (error?.code) {
    /** unique_violation */
    case "23505":
      return { status: 409, message: "That record already exists (duplicate value)." };
    /** foreign_key_violation */
    case "23503":
      return { status: 409, message: "Referenced record does not exist or is still in use." };
    /** not_null_violation */
    case "23502":
      return { status: 400, message: "A required field is missing." };
    /** check_violation */
    case "23514":
      return { status: 400, message: "A value failed a database constraint." };
    /** invalid_text_representation (e.g. bad UUID / integer) */
    case "22P02":
      return { status: 400, message: "A value has an invalid format." };
    /** string_data_right_truncation - a value is longer than its column allows */
    case "22001":
      return { status: 400, message: "A value is too long for its field." };
    /** undefined_table - the migration for this resource has not been run */
    case "42P01":
      return { status: 500, message: "Backend not migrated: a required table is missing." };
    default:
      return { status: 500, message: fallback };
  }
}
