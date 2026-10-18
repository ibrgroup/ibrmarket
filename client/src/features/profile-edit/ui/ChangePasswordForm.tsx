'use client';

import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { useToast } from '@/shared/hooks/use-toast';

export function ChangePasswordForm() {
  const { showError } = useToast();

  // Функционал смены пароля отключён, так как аутентификация переведена на OTP.
  const onSubmit = () => {
    showError('Смена пароля недоступна: вход выполняется только по OTP-коду.');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Alert variant="destructive">
        <AlertDescription>
          Смена пароля недоступна — система использует вход только по одноразовому OTP коду.
        </AlertDescription>
      </Alert>
      <Button type="submit" className="w-full">
        Понятно
      </Button>
    </form>
  );
}
