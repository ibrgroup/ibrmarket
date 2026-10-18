'use client';

import { cn } from '@/shared/lib/utils';
import { PhoneIcon } from 'lucide-react';
import * as React from 'react';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  error?: boolean;
  errorMessage?: string;
}

/**
 * Форматирует номер телефона в формат +7 (XXX) XXX-XX-XX
 * Работает только с российскими номерами
 */
const formatPhoneNumber = (value: string): string => {
  // Убираем все, кроме цифр
  const numbers = value.replace(/\D/g, '');

  // Если начинается с 8, заменяем на 7
  const normalizedNumbers = numbers.startsWith('8') ? '7' + numbers.slice(1) : numbers;

  // Если пустой ввод
  if (!normalizedNumbers) return '';

  // Если только код страны
  if (normalizedNumbers.length <= 1) return `+${normalizedNumbers}`;

  // Форматируем по частям
  let formatted = `+${normalizedNumbers[0]}`;

  // Код оператора (3 цифры)
  if (normalizedNumbers.length > 1) {
    formatted += ` (${normalizedNumbers.slice(1, 4)}`;
  }

  // Закрываем скобку если есть больше цифр
  if (normalizedNumbers.length >= 5) {
    formatted += ')';
  }

  // Первая часть номера (3 цифры)
  if (normalizedNumbers.length > 4) {
    formatted += ` ${normalizedNumbers.slice(4, 7)}`;
  }

  // Вторая часть номера (2 цифры)
  if (normalizedNumbers.length > 7) {
    formatted += `-${normalizedNumbers.slice(7, 9)}`;
  }

  // Третья часть номера (2 цифры)
  if (normalizedNumbers.length > 9) {
    formatted += `-${normalizedNumbers.slice(9, 11)}`;
  }

  return formatted;
};

/**
 * Извлекает только цифры из форматированного номера
 */
const getCleanNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

const PhoneInputComponent = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      containerClassName,
      inputClassName,
      className,
      error,
      errorMessage,
      value,
      onChange,
      disabled,
      id,
      placeholder = '+7 (999) 123-45-67',
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cleanNumber = getCleanNumber(inputValue);

      // Ограничиваем максимум 11 цифр (1 для кода страны + 10 для номера)
      if (cleanNumber.length > 11) return;

      const formatted = formatPhoneNumber(inputValue);
      onChange(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Разрешаем: backspace, delete, tab, escape, enter
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter'
      ) {
        return;
      }

      // Разрешаем: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x') {
        if (e.ctrlKey || e.metaKey) {
          return;
        }
      }

      // Разрешаем: Home, End, стрелки
      if (
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        return;
      }

      // Блокируем все, кроме цифр и +
      if (!/^[0-9+]$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Если поле пустое, автоматически вставляем +7
      if (!value || value === '') {
        onChange('+7');
      }
      props.onFocus?.(e);
    };

    return (
      <div className={cn('relative w-full', containerClassName)}>
        <div
          className={cn(
            // Базовые стили контейнера
            'relative flex h-10 w-full items-center rounded-md border border-input bg-background shadow-sm transition-colors',
            // Focus состояние
            'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
            // Error состояние
            error &&
              'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
            // Disabled состояние
            disabled && 'cursor-not-allowed opacity-50',
            // Кастомные классы
            className,
          )}
        >
          {/* Иконка телефона (опционально) */}
          <div className="flex items-center justify-center pl-3 text-muted-foreground">
            <PhoneIcon className="h-4 w-4" />
          </div>

          {/* Input */}
          <input
            ref={ref}
            id={id}
            type="tel"
            autoComplete="tel"
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error && errorMessage && id ? `${id}-error` : undefined}
            className={cn(
              // Базовые стили
              'flex-1 bg-transparent px-3 py-2 text-sm outline-none',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed',
              'selection:bg-primary selection:text-primary-foreground',
              // Кастомные классы
              inputClassName,
            )}
            {...props}
          />
        </div>

        {/* Error message */}
        {error && errorMessage && (
          <p
            id={id ? `${id}-error` : undefined}
            className="mt-1.5 text-xs font-medium text-destructive"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

PhoneInputComponent.displayName = 'PhoneInput';

export const PhoneInput = React.memo(PhoneInputComponent);

// Что можно добавить при необходимости:

// Поддержка других стран (сейчас только РФ)
// Валидация номера (проверка на корректность)
// Маска для других форматов
// Кастомная иконка или без иконки
