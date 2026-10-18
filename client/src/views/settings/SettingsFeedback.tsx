'use client';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { XCircle } from 'lucide-react';

export function SettingsPageSkeleton() {
  return (
    <div className="max-container mx-auto space-y-6 px-4 py-8">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="min-h-[280px] w-full rounded-2xl" />
    </div>
  );
}

type SettingsErrorAlertProps = {
  message: string;
  onDismiss: () => void;
};

export function SettingsErrorAlert({ message, onDismiss }: SettingsErrorAlertProps) {
  return (
    <div className="max-container mx-auto px-4 py-8">
      <div className="relative">
        <Alert variant="destructive" className="pr-12">
          <XCircle className="h-4 w-4" aria-hidden />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDismiss}
          aria-label="Закрыть"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
