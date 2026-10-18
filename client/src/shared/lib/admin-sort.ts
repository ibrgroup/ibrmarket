export type AdminSortDirection = 'asc' | 'desc';

export type AdminSortOption = { value: string; label: string };

/** Значение вида `field:asc` из селекта сортировки админки */
export function parseAdminSortSpec(
  spec: string,
  defaultField: string,
): { sort: string; order: AdminSortDirection } {
  const [field, dir] = spec.split(':');
  const sort = field?.trim() || defaultField;
  const order: AdminSortDirection = dir === 'asc' ? 'asc' : 'desc';
  return { sort, order };
}
