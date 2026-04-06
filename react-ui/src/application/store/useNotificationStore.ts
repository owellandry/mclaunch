/**
 * @file useNotificationStore.ts
 * @description Store de notificaciones. Sistema centralizado para despachar y gestionar alertas o mensajes (info, error, success).
 * 
 * Patrón: Atomic Design
 */
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
  unreadCount: number;
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (title, message, type = "info") => {
    const newNotification: NotificationItem = {
      id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11),
      title,
      message,
      type,
      read: false,
      timestamp: Date.now(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: state.notifications.reduce(
        (count, notification) => count + (notification.id === id || notification.read ? 0 : 1),
        0
      ),
    }));
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
