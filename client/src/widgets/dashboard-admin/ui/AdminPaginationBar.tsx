'use client';

import { Button } from '@/shared/ui/button';

type Props = {
  page: number;
  totalPages: number;
  total?: number | null;
  onPrev: () => void;
  onNext: () => void;
  /** Подпись слева вместо стандартной «Стр.» */
  labelPrefix?: string;
};

export function AdminPaginationBar({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
  labelPrefix = 'Стр.',
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        {labelPrefix} {page} из {totalPages}
        {total != null ? ` · всего ${total}` : null}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={onPrev}
        >
          Назад
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}
