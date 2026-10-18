/**
 * Стили таблиц админки: горизонтальный скролл, отступы, перенос текста в ячейках.
 * min-w задаёт нижнюю границу ширины таблицы, чтобы колонки не сжимались в «лесенку».
 */

/** Обертка Table: вертикальная + горизонтальная прокрутка, липкая шапка внутри области */
export const ADMIN_TABLE_VIEWPORT = 'max-h-[min(72vh,820px)] overflow-auto';
export const ADMIN_TABLE_ORDER =
  'min-w-[1180px] [&_th]:px-3 [&_th]:py-3 [&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:whitespace-normal';

export const ADMIN_TABLE_PRODUCT =
  'min-w-[1240px] [&_th]:px-3 [&_th]:py-3 [&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:whitespace-normal';

export const ADMIN_TABLE_USER =
  'min-w-[960px] [&_th]:px-3 [&_th]:py-3 [&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:whitespace-normal';

export const ADMIN_TABLE_AUDIT =
  'min-w-[1000px] [&_th]:px-3 [&_th]:py-3 [&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:whitespace-normal';

export const ADMIN_TABLE_CATEGORY =
  'min-w-[720px] [&_th]:px-3 [&_th]:py-3 [&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:whitespace-normal';

/** Таблица позиций в карточке заказа */
export const ADMIN_TABLE_ORDER_LINES =
  'min-w-[860px] [&_th]:px-3 [&_th]:py-2.5 [&_th]:align-middle [&_th]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:whitespace-normal';

/** Липкая шапка внутри прокручиваемого контейнера таблицы */
export const ADMIN_TABLE_HEADER_ROW =
  'bg-muted/95 supports-[backdrop-filter]:bg-muted/75 [&_tr]:border-b sticky top-0 z-20 shadow-sm backdrop-blur';
