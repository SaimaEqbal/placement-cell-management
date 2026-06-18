/* Shared domain types used across services/hooks/components. NOTE: the hand-rolled `Route` union that used to live here (for the old useState-based page switcher in App.tsx) has been removed now that routing
 is handled by react-router-dom - see src/routes/AppRoutes.tsx.

/* Visual tone used by <Badge>/<StatCard>/<Activity> - purely presentational, no business meaning. */
export type StatusTone = "green" | "amber" | "red" | "blue" | "gray";

/* Mirrors the `role` CHECK constraint on the `users` table exactly (server/src/migrations/006_create_users.sql: CHECK (role IN ('student','spc', 'tpc', 'admin'))). Keep these four values in sync with the backend if that constraint ever changes.
 */
export type Role = "student" | "spc" | "tpc" | "admin";
