import { Skeleton } from '@/shared/ui/skeleton';
import { TableCell, TableRow } from '@/shared/ui/table';

type Props = {
  colSpan: number;
  rows?: number;
};

/** Скелетон загрузки для таблиц админки вместо текстового «Загрузка…». */
export function AdminTableSkeletonRows({ colSpan, rows = 6 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={colSpan} className="py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
