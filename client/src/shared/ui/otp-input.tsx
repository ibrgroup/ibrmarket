'use client';

import { cn } from '@/shared/lib/utils';
import { ClipboardEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

export interface OtpInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  onChange?: (otp: string) => void;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
  value?: string;
}

/**
 * Enhanced OTP Input Component
 */
export function OtpInput({
  length = 6,
  onComplete,
  onChange,
  className,
  disabled = false,
  autoFocus = true,
  value = '',
  error = false,
}: OtpInputProps) {
  // Helper to get value as digit array
  const initializeOtp = useCallback(
    (val: string): string[] => {
      const arr = Array.from(val.replace(/\D/g, '').slice(0, length));
      while (arr.length < length) arr.push('');
      return arr;
    },
    [length],
  );

  // Main state
  const [otp, setOtp] = useState<string[]>(() => initializeOtp(value));
  // Focus tracking for focus ring and more accurate UX
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep OTP state controlled if value provided
  useEffect(() => {
    // Only sync value changes from outside
    if (typeof value === 'string') {
      const extOtp = initializeOtp(value);
      if (extOtp.join('') !== otp.join('')) {
        setOtp(extOtp);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length, initializeOtp]);

  // Focus first input on mount if needed
  useEffect(() => {
    if (autoFocus && !disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled, length]);

  // Вызываем onComplete когда код полностью введен
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === length && otp.every(Boolean)) {
      if (/^\d+$/.test(otpString)) {
        onComplete?.(otpString);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp.join(''), length, onComplete]);

  // Improved: auto jump on paste (only numbers), allow paste partial, smart autofocus
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>, pasteIdx: number) => {
      e.preventDefault();
      const pasteRaw = e.clipboardData.getData('text/plain');
      const digits = pasteRaw.replace(/\D/g, '').split('');
      if (!digits.length) return;
      const newOtp = [...otp];
      let changed = false;
      let putIndex = pasteIdx;
      for (const digit of digits) {
        if (putIndex >= length) break;
        newOtp[putIndex] = digit;
        putIndex++;
        changed = true;
      }
      if (changed) {
        setOtp(newOtp);
        // Вызываем onChange сразу после изменения состояния
        const otpString = newOtp.join('');
        onChange?.(otpString);
        setTimeout(() => {
          const nextFocus = Math.min(putIndex, length - 1);
          inputRefs.current[nextFocus]?.focus();
          setFocusIndex(nextFocus); // For ring UX
        }, 0);
      }
    },
    [otp, length],
  );

  // Typing handler (auto move forward on digit, replace, clear, etc)
  const handleInputChange = (i: number, val: string) => {
    if (val && !/^\d+$/.test(val)) return;
    const chars = val.replace(/\D/g, '').split('');
    const newOtp = [...otp];
    // smart: if user pastes multiple digits by quickly typing, distribute forward
    let cursor = i;
    for (const c of chars) {
      if (cursor >= length) break;
      newOtp[cursor] = c;
      cursor++;
    }
    if (!chars.length) {
      // delete character
      newOtp[i] = '';
    }
    setOtp(newOtp);
    // Move focus only if input was provided, not removed
    if (chars.length && cursor < length && inputRefs.current[cursor]) {
      inputRefs.current[cursor]?.focus();
      setFocusIndex(cursor);
    } else if (chars.length && cursor >= length) {
      // Move focus to last
      inputRefs.current[length - 1]?.focus();
      setFocusIndex(length - 1);
    }
  };

  // Keyboard navigation and deletion
  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      // Select all and del? Just clear
      const target = e.currentTarget;
      if (target.selectionStart === 0 && !otp[i] && i > 0) {
        e.preventDefault();
        inputRefs.current[i - 1]?.focus();
        setFocusIndex(i - 1);
      }
      // If field not empty, just remove
      if (otp[i]) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[i] = '';
        setOtp(newOtp);
      }
    }
    if (e.key === 'Delete' && otp[i]) {
      const newOtp = [...otp];
      newOtp[i] = '';
      setOtp(newOtp);
      // Вызываем onChange сразу после изменения состояния
      const otpString = newOtp.join('');
      onChange?.(otpString);
    }
    if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      inputRefs.current[i - 1]?.focus();
      setFocusIndex(i - 1);
    }
    if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault();
      inputRefs.current[i + 1]?.focus();
      setFocusIndex(i + 1);
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
    }
  };

  // Click/focus ring UX
  const handleFocus = (i: number) => {
    setFocusIndex(i);
    inputRefs.current[i]?.select();
  };

  // Mouse out: remove ring
  const handleBlur = () => setFocusIndex(null);

  // Accessibility: mark error and aria
  // Improved visual cues for error/active/filled digit
  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="group"
      aria-label="OTP Code Input"
    >
      {[...Array(length)].map((_, i) => {
        const isActive = focusIndex === i;
        const isFilled = Boolean(otp[i]);
        return (
          <input
            key={`otp-${i}-${length}`}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            value={otp[i]}
            onPaste={(e) => handlePaste(e, i)}
            onChange={(e) => handleInputChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={() => handleFocus(i)}
            onBlur={handleBlur}
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `otp-error-${i}` : undefined}
            className={cn(
              'transition-all duration-100',
              'bg-background border border-input text-foreground placeholder:text-muted-foreground',
              'h-12 w-12 flex items-center justify-center rounded-lg text-center text-xl font-bold',
              'outline-none focus:ring-2 focus:ring-offset-2',
              isActive && 'focus:ring-primary shadow-lg ring-1 ring-primary',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500 ring-red-500',
              isFilled && !error && 'border-primary ring-primary',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted',
              'select-none',
            )}
            style={isActive ? { boxShadow: '0 0 0 2px var(--tw-ring-color)' } : undefined}
          />
        );
      })}
    </div>
  );
}

/**
 * Проверка корректности OTP кода
 */
// eslint-disable-next-line react-refresh/only-export-components
export function isValidOtp(otp: string, length: number = 6): boolean {
  return /^\d+$/.test(otp) && otp.length === length;
}
