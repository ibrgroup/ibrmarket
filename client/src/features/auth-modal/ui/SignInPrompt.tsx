'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuthModal } from '../lib/hooks/useAuthModal';
import type { AuthIntent } from '../model/types';

type SignInPromptProps = {
  title?: string;
  description?: string;
  intent?: AuthIntent;
  className?: string;
};

export function SignInPrompt({
  title = 'Необходимо войти',
  description = 'Войдите в аккаунт, чтобы продолжить',
  intent = { type: 'profile' },
  className,
}: SignInPromptProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <div
      className={cn(
        'max-container mx-auto px-4 py-8 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-8',
        className,
      )}
    >
      <div className="mx-auto max-w-md rounded-2xl bg-card px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10">
          <LogIn className="size-7 text-indigo-500" aria-hidden />
        </div>
        <h1 className="font-roboto text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            type="button"
            className="h-11 w-full rounded-xl bg-indigo-500 font-roboto text-base font-semibold hover:bg-indigo-500/90"
            onClick={() => openAuthModal(intent)}
          >
            Войти в аккаунт
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground h-10 w-full rounded-xl font-medium"
            asChild
          >
            <Link href="/">Вернуться на главную</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
