import { Button } from '@/shared/ui/button';

interface ProductsErrorProps {
  error: Error | string | unknown;
  onRetry?: () => void;
}

export function ProductsError({ error, onRetry }: ProductsErrorProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Ошибка загрузки товаров';

  return (
    <div className="py-12 text-center">
      <p className="text-muted-foreground mb-4">{errorMessage}</p>
      {onRetry && <Button onClick={onRetry}>Повторить попытку</Button>}
    </div>
  );
}
