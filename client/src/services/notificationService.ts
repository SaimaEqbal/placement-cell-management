// Purpose: notification data for the student/admin Notifications views.
//
// STATUS: mock data, per the project brief ("Mock data is acceptable
// initially"). There is no GET /notifications route anywhere in the backend
// (server/src/routes) yet. This module exposes the same async shape a real
// service would - a Promise resolving to NotificationRecord[] - so
// src/hooks/useNotifications.ts and every page that uses it will not need to
// change at all once the backend adds a real endpoint; only the body of
// getNotifications() below would switch to an axiosInstance.get call.

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  tone: "green" | "amber" | "red" | "blue" | "gray";
  createdAt: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationRecord[] = [
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
export function getNotifications(): Promise<NotificationRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_NOTIFICATIONS), 300);
  });
}
