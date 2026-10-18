interface ProductsHeaderProps {
  isLoading: boolean;
  totalProducts: number;
}

function formatGoodsCount(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return `${n.toLocaleString('ru-RU')} товаров`;
  if (last === 1) return `${n.toLocaleString('ru-RU')} товар`;
  if (last >= 2 && last <= 4) return `${n.toLocaleString('ru-RU')} товара`;
  return `${n.toLocaleString('ru-RU')} товаров`;
}

export function ProductsHeader({ isLoading, totalProducts }: ProductsHeaderProps) {
  return (
    <div className="mt-3 flex justify-between items-center gap-2 rounded-2xl bg-card px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-foreground text-xl font-roboto font-bold tracking-tight sm:text-2xl">
          Каталог товаров
        </h1>
      </div>
      {isLoading ? (
        <div className="bg-muted h-5 w-36 shrink-0 animate-pulse rounded-md" aria-hidden />
      ) : (
        <p className="text-muted-foreground shrink-0 text-sm tabular-nums sm:text-right">
          {formatGoodsCount(totalProducts)}
        </p>
      )}
    </div>
  );
}
