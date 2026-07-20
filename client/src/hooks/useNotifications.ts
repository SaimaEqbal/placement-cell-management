import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clearAllNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRecord,
} from "../services/notificationService";
import { queryKeys } from "./queryKeys";

/** Purpose: fetch the signed-in user's notifications (GET /notifications - see notificationService.ts). */
export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery<NotificationRecord[]>({
    queryKey: queryKeys.notifications,
    queryFn: getNotifications,
    enabled: options?.enabled ?? true,
  });
}

/** Purpose: mark a single notification as read, optimistically updating the cached list. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = queryClient.getQueryData<NotificationRecord[]>(
        queryKeys.notifications,
      );

      queryClient.setQueryData<NotificationRecord[]>(
        queryKeys.notifications,
        (old) =>
          old?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? old,
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

/** Purpose: mark every notification as read, optimistically updating the cached list. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = queryClient.getQueryData<NotificationRecord[]>(
        queryKeys.notifications,
      );

      queryClient.setQueryData<NotificationRecord[]>(
        queryKeys.notifications,
        (old) => old?.map((n) => ({ ...n, read: true })) ?? old,
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

/** Purpose: delete every notification belonging to the signed-in user, optimistically emptying the cached list. */
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearAllNotifications(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = queryClient.getQueryData<NotificationRecord[]>(
        queryKeys.notifications,
      );

      queryClient.setQueryData<NotificationRecord[]>(queryKeys.notifications, []);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
