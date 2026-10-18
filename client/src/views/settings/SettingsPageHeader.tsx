'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

export type SettingsPageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function SettingsPageHeader({
  title,
  description,
  icon: Icon,
  backHref,
  backLabel = 'Назад к настройкам',
  className,
}: SettingsPageHeaderProps) {
  return (
    <div className={cn('mb-3 space-y-4', className)}>
      {backHref ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {backLabel}
          </Link>
        </Button>
      ) : null}
      <div className="rounded-2xl bg-card px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="font-roboto flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {Icon ? <Icon className="h-7 w-7 shrink-0 text-primary" aria-hidden /> : null}
          <span className="min-w-0 truncate">{title}</span>
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
