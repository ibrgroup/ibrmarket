import { useCallback } from 'react';
import type { NotificationType } from '../model/types';

interface UseNotificationSoundProps {
  enabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}

export function useNotificationSound({
  enabled = true,
  soundEnabled = true,
  vibrationEnabled = true,
}: UseNotificationSoundProps = {}) {
  // Функция для воспроизведения звука
  const playSound = useCallback(async () => {
    if (!enabled || !soundEnabled) return;

    try {
      // Попытка воспроизвести звук через Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;

      oscillator.start();

      // Останавливаем осциллятор через 200ms
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (error) {
      console.warn('Не удалось воспроизвести звук:', error);

      // Альтернативный способ через воспроизведение звука из data URI
      try {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
        }, 200);
      } catch (fallbackError) {
        console.warn('Не удалось воспроизвести звук через fallback:', fallbackError);
      }
    }
  }, [enabled, soundEnabled]);

  // Функция для вибрации
  const vibrate = useCallback(() => {
    if (!enabled || !vibrationEnabled) return;

    // Проверяем поддержку вибрации
    if ('vibrate' in navigator) {
      try {
        // Вибрация на 200ms
        navigator.vibrate(200);
      } catch (error) {
        console.warn('Не удалось выполнить вибрацию:', error);
      }
    }
  }, [enabled, vibrationEnabled]);

  // Функция для воспроизведения звука и вибрации одновременно
  const playNotificationSound = useCallback(async () => {
    if (!enabled) return;

    if (soundEnabled) {
      await playSound();
    }

    if (vibrationEnabled) {
      vibrate();
    }
  }, [enabled, soundEnabled, vibrationEnabled, playSound, vibrate]);

  // Функция для проверки, является ли уведомление важным
  const isImportantNotification = useCallback((type: NotificationType): boolean => {
    // Важные типы уведомлений, которые требуют звукового сигнала
    const importantTypes: NotificationType[] = ['security', 'payment', 'delivery', 'order'];
    return importantTypes.includes(type);
  }, []);

  return {
    playSound,
    vibrate,
    playNotificationSound,
    isImportantNotification,
  };
}
