import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationStore } from './types';

/**
 * Вычисляет дату доставки (завтра по умолчанию)
 */
function getDefaultDeliveryDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/**
 * Store для управления геолокацией и городом доставки
 */
export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      // Initial state
      city: 'Магас',
      deliveryDate: getDefaultDeliveryDate(),
      isAutoDetected: false,

      // Actions
      setCity: (city: string) => {
        set({ city, isAutoDetected: false });
      },

      setDeliveryDate: (date: string | null) => {
        set({ deliveryDate: date });
      },

      detectLocation: async () => {
        // Попытка автоматического определения города
        // В реальном проекте здесь можно использовать API геолокации
        try {
          // Можно использовать браузерный Geolocation API или внешний сервис
          // Для примера оставляем дефолтное значение
          set({
            city: 'Магас',
            deliveryDate: getDefaultDeliveryDate(),
            isAutoDetected: true,
          });
        } catch (error) {
          console.error('Ошибка определения местоположения:', error);
          set({
            city: 'Магас',
            deliveryDate: getDefaultDeliveryDate(),
            isAutoDetected: false,
          });
        }
      },

      reset: () => {
        set({
          city: 'Магас',
          deliveryDate: getDefaultDeliveryDate(),
          isAutoDetected: false,
        });
      },
    }),
    {
      name: 'ibr-location-storage',
    },
  ),
);
