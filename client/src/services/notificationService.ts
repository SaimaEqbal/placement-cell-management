// Purpose: notification data for the student/admin Notifications views.
//
// STATUS: mock data, per the project brief ("Mock data is acceptable
// initially"). There is no GET /notifications route anywhere in the backend
// (server/src/routes) yet. This module exposes the same async shape a real
// service would - a Promise resolving to NotificationRecord[] - so
// src/hooks/useNotifications.ts and every page that uses it will not need to
// change at all once the backend adds a real endpoint; only the body of
// getNotifications() below would switch to an axiosInstance.get call.
import { axiosInstance } from "../api/axiosInstance";
export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  tone: "green" | "amber" | "red" | "blue" | "gray";
  createdAt: string;
  read: boolean;
}
/** Raw shape of a row from the `notifications` table, as returned by the API. */
interface NotificationRow {
  id: number | string;
  user_id: string;
  title: string;
  message: string;
  tone: "green" | "amber" | "red" | "blue" | "gray";
  read: boolean;
  created_at: string;
}
/** 
 * const MOCK_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: "n1",
    title: "Profile submitted",
    message:
      "Your placement profile was submitted and is awaiting SPC review.",
    tone: "blue",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    read: false,
  },
  {
    id: "n2",
    title: "SPC verification pending",
    message: "Your documents are currently in the SPC review queue.",
    tone: "amber",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: "n3",
    title: "New placement drive announced",
    message: "A new company has been added to the placement drives list.",
    tone: "green",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: true,
  },
];

/** Purpose: simulate GET /notifications with a small artificial delay so loading states render exactly as they would for a real request. */
/** 
export function getNotifications(): Promise<NotificationRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_NOTIFICATIONS), 300);
  });
}
 */

function toNotificationRecord(row: NotificationRow): NotificationRecord {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    tone: row.tone,
    createdAt: row.created_at,
    read: row.read,
  };
}

/** Purpose: GET /notifications - the signed-in user's own notifications, newest first. */
export function getNotifications(): Promise<NotificationRecord[]> {
  return axiosInstance
    .get<NotificationRow[]>("/notifications")
    .then((res) => res.data.map(toNotificationRecord));
}

/** Purpose: PATCH /notifications/:id/read - mark one notification as read. */
export function markNotificationRead(id: string): Promise<NotificationRecord> {
  return axiosInstance
    .patch<NotificationRow>(`/notifications/${id}/read`)
    .then((res) => toNotificationRecord(res.data));
}

/** Purpose: PATCH /notifications/read-all - mark every unread notification as read. */
export function markAllNotificationsRead(): Promise<NotificationRecord[]> {
  return axiosInstance
    .patch<NotificationRow[]>("/notifications/read-all")
    .then((res) => res.data.map(toNotificationRecord));
}

/** Purpose: DELETE /notifications/:id - remove a notification. */
export function deleteNotification(id: string): Promise<{ message: string }> {
  return axiosInstance
    .delete<{ message: string }>(`/notifications/${id}`)
    .then((res) => res.data);
}
