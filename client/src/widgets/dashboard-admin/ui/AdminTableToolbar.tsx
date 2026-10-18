'use client';

import { cn } from '@/shared/lib/utils';

type Props = {
  /** Фильтры, поиск — слева */
  primary?: React.ReactNode;
  /** Сортировка, вторичные действия — справа */
  secondary?: React.ReactNode;
  className?: string;
};

export function AdminTableToolbar({ primary, secondary, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between',
        className,
      )}
    >
      {primary ? (
        <div className="grid w-full min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap lg:items-end xl:grid-cols-none">
          {primary}
        </div>
      ) : null}
      {secondary ? (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {secondary}
        </div>
      ) : null}
    </div>
  );
}
