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
  /** Currently visible toast stack (surface alerts without opening the bell). */
  toasts: NotificationItem[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const MAX_HISTORY = 40;
const MAX_TOASTS = 4;

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  toasts: [],
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
      notifications: [newNotification, ...state.notifications].slice(0, MAX_HISTORY),
      toasts: [newNotification, ...state.toasts].slice(0, MAX_TOASTS),
      unreadCount: state.notifications.filter((n) => !n.read).length + 1,
    }));
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((n) => n.id !== id),
    }));
  },
  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    });
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  clearAll: () => {
    set({ notifications: [], toasts: [], unreadCount: 0 });
  },
}));
