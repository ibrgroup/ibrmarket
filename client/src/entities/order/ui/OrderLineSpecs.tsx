import { cn } from '@/shared/lib/utils';
import { getOrderLineSpecRows, type OrderLineSpecRow } from '../lib/order-line-specs';
import type { OrderProduct } from '../model/types';

type Props = {
  line: Pick<OrderProduct, 'size' | 'color' | 'ram' | 'weight' | 'discount'>;
  className?: string;
  emptyHint?: boolean;
};

function SpecChip({ row }: { row: OrderLineSpecRow }) {
  return (
    <span className="bg-muted/70 inline-flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] leading-tight">
      {row.colorVisual ? (
        <span
          className={cn(
            'size-3 shrink-0 rounded-full border',
            row.colorVisual.ring && 'border-foreground/25',
          )}
          style={row.colorVisual.style}
          aria-hidden
        />
      ) : null}
      <span className="text-muted-foreground">{row.label}:</span>
      <span className="text-foreground font-medium break-words">{row.value}</span>
    </span>
  );
}

export function OrderLineSpecs({ line, className, emptyHint = false }: Props) {
  const rows = getOrderLineSpecRows(line);
  if (!rows.length) {
    if (!emptyHint) return null;
    return (
      <p className={cn('text-muted-foreground mt-1 text-xs', className)}>
        Размер, цвет и другие параметры в заказе не зафиксированы
      </p>
    );
  }

  return (
    <div className={cn('mt-1.5 flex flex-wrap gap-1', className)}>
      {rows.map((row) => (
        <SpecChip key={row.key} row={row} />
      ))}
    </div>
  );
}
