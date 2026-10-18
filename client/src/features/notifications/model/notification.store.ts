import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from './types';

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  // Preferences
  preferences: {
    showOnlyUnread: boolean;
    groupByType: boolean;
    maxPerGroup: number;
    hiddenCategories: Notification['type'][];
    enableVirtualization: boolean;
    sound: {
      masterVolume: number; // 0..1
      perType: Partial<Record<Notification['type'], { frequency: number; volume: number }>>;
    };
  };

  // Simple UX analytics
  analytics: {
    openedAt: number | null;
    lastInteractionAt: number | null;
    markAsReadCount: number;
    clearCount: number;
    clearAllCount: number;
  };

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
  fetchNotifications: () => Promise<void>;
  toggleSound: () => void;
  toggleVibration: () => void;
  // Networked actions
  apiMarkAsRead: (id: string) => Promise<void>;
  apiMarkAllAsRead: () => Promise<void>;
  apiRemove: (id: string) => Promise<void>;
  apiClearAll: () => Promise<void>;
  // Preferences actions
  setShowOnlyUnread: (value: boolean) => void;
  setGroupByType: (value: boolean) => void;
  setMaxPerGroup: (value: number) => void;
  setHiddenCategories: (value: Notification['type'][]) => void;
  setEnableVirtualization: (value: boolean) => void;
  setMasterVolume: (v: number) => void;
  setTypeSound: (type: Notification['type'], cfg: { frequency: number; volume: number }) => void;
  // Analytics helpers
  trackOpened: () => void;
  trackInteraction: () => void;
  trackEvent: (eventType: string, meta?: Record<string, any>) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      soundEnabled: true,
      vibrationEnabled: true,
      preferences: {
        showOnlyUnread: false,
        groupByType: true,
        maxPerGroup: 10,
        hiddenCategories: [],
        enableVirtualization: true,
        sound: {
          masterVolume: 0.3,
          perType: {
            security: { frequency: 900, volume: 0.4 },
            payment: { frequency: 700, volume: 0.35 },
            delivery: { frequency: 600, volume: 0.35 },
            order: { frequency: 800, volume: 0.35 },
          },
        },
      },
      analytics: {
        openedAt: null,
        lastInteractionAt: null,
        markAsReadCount: 0,
        clearCount: 0,
        clearAllCount: 0,
      },

      addNotification: notification => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}`,
          createdAt: new Date(),
        };

        // Проверяем, является ли уведомление важным
        const importantTypes: Notification['type'][] = ['security', 'payment', 'delivery', 'order'];
        const isImportant = importantTypes.includes(newNotification.type);

        // Если уведомление важное и включены звуки/вибрация, воспроизводим их
        if (isImportant) {
          const state = get();
          if (state.soundEnabled || state.vibrationEnabled) {
            // Создаем аудио контекст для воспроизведения звука
            try {
              if (state.soundEnabled) {
                const audioContext = new (window.AudioContext ||
                  (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                const cfg = state.preferences.sound.perType[newNotification.type] || {
                  frequency: 800,
                  volume: 0.3,
                };
                const vol = Math.max(
                  0,
                  Math.min(1, cfg.volume * state.preferences.sound.masterVolume)
                );

                oscillator.type = 'sine';
                oscillator.frequency.value = cfg.frequency;
                gainNode.gain.value = vol;

                oscillator.start();

                // Останавливаем осциллятор через 200ms
                setTimeout(() => {
                  oscillator.stop();
                }, 200);
              }

              if (state.vibrationEnabled && 'vibrate' in navigator) {
                // Вибрация на 200ms
                navigator.vibrate([120, 80, 120]);
              }
            } catch (error) {
              console.warn('Не удалось воспроизвести звук или вибрацию:', error);
            }
          }
        }

        set(state => {
          const updatedNotifications = [newNotification, ...state.notifications];
          const unreadCount = updatedNotifications.filter(n => !n.read).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      markAsRead: id => {
        set(state => {
          const updatedNotifications = state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          const unreadCount = updatedNotifications.filter(n => !n.read).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
            analytics: {
              ...state.analytics,
              markAsReadCount: state.analytics.markAsReadCount + 1,
              lastInteractionAt: Date.now(),
            },
          };
        });
      },

      markAllAsRead: () => {
        set(state => {
          const updatedNotifications = state.notifications.map(notification => ({
            ...notification,
            read: true,
          }));

          return {
            notifications: updatedNotifications,
            unreadCount: 0,
          };
        });
      },

      removeNotification: id => {
        set(state => {
          const updatedNotifications = state.notifications.filter(
            notification => notification.id !== id
          );
          const unreadCount = updatedNotifications.filter(n => !n.read).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
            analytics: {
              ...state.analytics,
              clearCount: state.analytics.clearCount + 1,
              lastInteractionAt: Date.now(),
            },
          };
        });
      },

      clearAll: () => {
        set(state => ({
          notifications: [],
          unreadCount: 0,
          analytics: {
            ...state.analytics,
            clearAllCount: state.analytics.clearAllCount + 1,
            lastInteractionAt: Date.now(),
          },
        }));
      },

      setNotifications: notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        set({
          notifications,
          unreadCount,
        });
      },

      fetchNotifications: async () => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/notification', { credentials: 'include' });
          if (!res.ok) throw new Error('Failed to fetch notifications');
          const data = await res.json();
          const items = (data.items || []) as any[];
          const mapped: Notification[] = items.map(x => ({
            id: String(x._id || x.id),
            title: x.title,
            message: x.message,
            type: x.type,
            read: !!x.read,
            createdAt: new Date(x.createdAt || Date.now()),
            actionUrl: x.actionUrl,
            data: x.data,
          }));
          set({ notifications: mapped, isLoading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch notifications';
          set({ error: errorMessage, isLoading: false });
        }
      },

      apiMarkAsRead: async id => {
        try {
          await fetch(`/api/notification/${id}/read`, { method: 'PATCH', credentials: 'include' });
        } catch {
          // ignore error
        }
      },
      apiMarkAllAsRead: async () => {
        try {
          await fetch(`/api/notification/read-all`, { method: 'PATCH', credentials: 'include' });
        } catch {
          // ignore error
        }
      },
      apiRemove: async id => {
        try {
          await fetch(`/api/notification/${id}`, { method: 'DELETE', credentials: 'include' });
        } catch {
          // ignore error
        }
      },
      apiClearAll: async () => {
        try {
          await fetch(`/api/notification`, { method: 'DELETE', credentials: 'include' });
        } catch {
          // ignore error
        }
      },

      toggleSound: () => {
        set(state => ({ soundEnabled: !state.soundEnabled }));
      },

      toggleVibration: () => {
        set(state => ({ vibrationEnabled: !state.vibrationEnabled }));
      },

      // Preferences actions
      setShowOnlyUnread: value =>
        set(state => ({ preferences: { ...state.preferences, showOnlyUnread: value } })),
      setGroupByType: value =>
        set(state => ({ preferences: { ...state.preferences, groupByType: value } })),
      setMaxPerGroup: value =>
        set(state => ({
          preferences: { ...state.preferences, maxPerGroup: Math.max(1, value) },
        })),
      setHiddenCategories: value =>
        set(state => ({ preferences: { ...state.preferences, hiddenCategories: value } })),
      setEnableVirtualization: value =>
        set(state => ({ preferences: { ...state.preferences, enableVirtualization: value } })),
      setMasterVolume: v =>
        set(state => ({
          preferences: {
            ...state.preferences,
            sound: { ...state.preferences.sound, masterVolume: Math.max(0, Math.min(1, v)) },
          },
        })),
      setTypeSound: (type, cfg) =>
        set(state => ({
          preferences: {
            ...state.preferences,
            sound: {
              ...state.preferences.sound,
              perType: { ...state.preferences.sound.perType, [type]: cfg },
            },
          },
        })),

      // Analytics helpers
      trackOpened: () =>
        set(state => ({ analytics: { ...state.analytics, openedAt: Date.now() } })),
      trackInteraction: () =>
        set(state => ({ analytics: { ...state.analytics, lastInteractionAt: Date.now() } })),
      trackEvent: async (eventType, meta) => {
        try {
          await fetch('/api/notification-analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ eventType, meta }),
          });
        } catch {
          // ignore error
        }
      },
    }),
    {
      name: 'notification-store',
      partialize: state => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        preferences: state.preferences,
        analytics: state.analytics,
      }),
    }
  )
);
