import { useQuery } from "@tanstack/react-query";

import {
  getNotifications,
  type NotificationRecord,
} from "../services/notificationService";
import { queryKeys } from "./queryKeys";

/** Purpose: fetch (currently mocked - see notificationService.ts) the signed-in user's notifications. */
export function useNotifications() {
  return useQuery<NotificationRecord[]>({
    queryKey: queryKeys.notifications,
    queryFn: getNotifications,
  });
}
