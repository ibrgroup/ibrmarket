import { Button } from '@/shared/ui/button';

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProductsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ProductsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <div className="text-muted-foreground text-sm">
        Страница {currentPage} из {totalPages}
      </div>
      <nav aria-label="Пагинация">
        <ul className="flex flex-wrap items-center justify-center gap-2">
          <li>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : 0}
            >
              Предыдущая
            </Button>
          </li>
          {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
            let pageNum = i + 1;
            if (totalPages > 10) {
              if (currentPage > 5 && currentPage < totalPages - 4) {
                pageNum = currentPage - 5 + i;
              } else if (currentPage >= totalPages - 4) {
                pageNum = totalPages - 9 + i;
              }
            }
            return (
              <li key={i}>
                <Button
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                  tabIndex={0}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              </li>
            );
          })}
          <li>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : 0}
            >
              Следующая
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
