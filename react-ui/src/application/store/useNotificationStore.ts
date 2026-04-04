import { create } from "zustand";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: number;
}

export interface NotificationStore {
  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  addNotification: (title, message, type = "info") => {
    const newNotification: NotificationItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      read: false,
      timestamp: Date.now(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  clearAll: () => {
    set({ notifications: [] });
  },
  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));