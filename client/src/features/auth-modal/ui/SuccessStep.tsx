/**
 * Третий шаг модального окна авторизации - успешный вход
 */

'use client';

import { CheckCircle2 } from 'lucide-react';

interface SuccessStepProps {
  /** Имя пользователя (если есть) */
  userName?: string;
}

/**
 * Компонент третьего шага авторизации - успешный вход
 */
export function SuccessStep({ userName }: SuccessStepProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <div className="text-center">
        <h2 className="text-xl font-roboto text-md">
          {userName ? `Добро пожаловать, ${userName}!` : 'Вы вошли в систему'}
        </h2>
      </div>
    </div>
  );
}
