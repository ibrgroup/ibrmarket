/**
 * Первый шаг модального окна авторизации - ввод контакта
 */

'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { detectContactType, validateContact, formatPhoneInput } from '../lib/utils';
import { ERROR_MESSAGES } from '../model/constants';

interface LoginStepProps {
  /** Callback при отправке контакта */
  onSubmit: (contact: string) => Promise<void>;
  /** Начальное значение контакта */
  initialContact?: string;
}

/**
 * Компонент первого шага авторизации - ввод email или телефона
 */
export function LoginStep({ onSubmit, initialContact = '' }: LoginStepProps) {
  const [contact, setContact] = useState(initialContact);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const contactType = detectContactType(contact);
  const isValid = validateContact(contact);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError(ERROR_MESSAGES.INVALID_CONTACT);
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(contact);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : ERROR_MESSAGES.OTP_SEND_FAILED
      );
    } finally {
      setIsLoading(false);
    }
  };

  const placeholder = contactType === 'email' ? 'example@email.com' : '+7 (999) 999-99-99';

  return (
    <>
      <img className='w-52 my-5 m-auto' src="/ibrmarket.png" alt="ibrmarket" />
      <div className="space-y-3 bg-gray-200 md:bg-gray-100 p-5 rounded-3xl">

        {/* Заголовок */}
        <h2 className="text-xl font-bold mt-2 text-center font-roboto">Войти или создать профиль</h2>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4 outline-none">
          <div className="space-y-2">
            <Input
              id="contact"
              type="text"
              inputMode={contactType === 'phone' ? 'tel' : 'tel'}
              placeholder={placeholder}
              value={contact}
              onChange={(e) => {
                const inputValue = e.target.value;

                // Если есть @ или начинается с буквы - это email, не форматируем
                if (inputValue.includes('@') || (inputValue.length > 0 && /^[a-zA-Z]/.test(inputValue))) {
                  setContact(inputValue);
                  setError(null);
                  return;
                }

                // Если ввод содержит только цифры, +, 8, 7, пробелы, дефисы, скобки - это телефон
                const digitsCount = (inputValue.match(/\d/g) || []).length;
                const isPhoneInput = digitsCount > 0 && /^[\d+7\s\-()]*$/.test(inputValue);

                if (isPhoneInput) {
                  // Форматируем телефон в реальном времени
                  const formatted = formatPhoneInput(inputValue);
                  setContact(formatted);
                } else {
                  // Иначе оставляем как есть
                  setContact(inputValue);
                }

                setError(null);
              }}
              disabled={isLoading}
              className="h-12 font-roboto bg-white"
              autoFocus
              autoComplete="username"
            />

            {/* Ошибка валидации */}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-roboto"
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              'Получить код'
            )}
          </Button>
        </form>

        {/* Согласие */}
        <div className="text-center text-xs text-muted-foreground leading-relaxed">
          Нажимая на кнопку, я соглашаюсь{' '}
          <a href="/terms" className="text-primary underline hover:no-underline">
            с правилами пользования торговой площадкой
          </a>
          .<br />
          <a href="/privacy" className="text-primary underline hover:no-underline">
            Политика конфиденциальности
          </a>
        </div>
      </div>
    </>
  );
}
