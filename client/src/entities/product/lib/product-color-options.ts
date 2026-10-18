import type { CSSProperties } from 'react';

/** Сохраняем в БД стабильный id; подпись и образец берутся из палитры. */
export type ProductColorPaletteEntry = {
  id: string;
  label: string;
  /** CSS background (цвет или gradient) */
  background: string;
  /** Обводка у светлых оттенков */
  ring?: boolean;
};

export const PRODUCT_COLOR_PALETTE: ProductColorPaletteEntry[] = [
  { id: 'white', label: 'Белый', background: '#ffffff', ring: true },
  { id: 'black', label: 'Чёрный', background: '#171717' },
  { id: 'gray', label: 'Серый', background: '#6b7280' },
  { id: 'silver', label: 'Серебристый', background: '#c0c0c0', ring: true },
  { id: 'red', label: 'Красный', background: '#dc2626' },
  { id: 'burgundy', label: 'Бордовый', background: '#7f1d1d' },
  { id: 'pink', label: 'Розовый', background: '#ec4899' },
  { id: 'coral', label: 'Коралловый', background: '#fb7185' },
  { id: 'orange', label: 'Оранжевый', background: '#ea580c' },
  { id: 'yellow', label: 'Жёлтый', background: '#eab308', ring: true },
  { id: 'gold', label: 'Золотой', background: '#ca8a04' },
  { id: 'green', label: 'Зелёный', background: '#16a34a' },
  { id: 'olive', label: 'Оливковый', background: '#4d7c0f' },
  { id: 'mint', label: 'Мятный', background: '#34d399' },
  { id: 'teal', label: 'Бирюзовый', background: '#0d9488' },
  { id: 'blue', label: 'Синий', background: '#2563eb' },
  { id: 'navy', label: 'Тёмно-синий', background: '#1e3a8a' },
  { id: 'sky', label: 'Голубой', background: '#0ea5e9' },
  { id: 'purple', label: 'Фиолетовый', background: '#9333ea' },
  { id: 'violet', label: 'Пурпурный', background: '#7c3aed' },
  { id: 'brown', label: 'Коричневый', background: '#78350f' },
  { id: 'beige', label: 'Бежевый', background: '#d6c8b4', ring: true },
  { id: 'cream', label: 'Кремовый', background: '#fff8e7', ring: true },
  { id: 'khaki', label: 'Хаки', background: '#a89f68' },
  {
    id: 'multicolor',
    label: 'Мультиколор',
    background: 'conic-gradient(from 45deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)',
  },
];

const PALETTE_BY_ID = new Map(PRODUCT_COLOR_PALETTE.map((e) => [e.id.toLowerCase(), e]));

const LABEL_TO_ID = new Map<string, string>();
for (const e of PRODUCT_COLOR_PALETTE) {
  LABEL_TO_ID.set(e.label.toLowerCase().trim(), e.id);
}

/** Синонимы и старые текстовые значения → id палитры */
const ALIASES: Record<string, string> = {
  // русские
  красный: 'red',
  красная: 'red',
  красное: 'red',
  черный: 'black',
  чёрный: 'black',
  черная: 'black',
  чёрная: 'black',
  белый: 'white',
  белая: 'white',
  белое: 'white',
  серый: 'gray',
  серая: 'gray',
  серебро: 'silver',
  серебристый: 'silver',
  бордовый: 'burgundy',
  розовый: 'pink',
  коралл: 'coral',
  коралловый: 'coral',
  оранжевый: 'orange',
  желтый: 'yellow',
  жёлтый: 'yellow',
  золотой: 'gold',
  зеленый: 'green',
  зелёный: 'green',
  оливковый: 'olive',
  мятный: 'mint',
  бирюзовый: 'teal',
  синий: 'blue',
  голубой: 'sky',
  фиолетовый: 'purple',
  пурпурный: 'violet',
  коричневый: 'brown',
  бежевый: 'beige',
  кремовый: 'cream',
  хаки: 'khaki',
  мультиколор: 'multicolor',
  разноцветный: 'multicolor',
  пестрый: 'multicolor',
  // английские / транслит частый
  red: 'red',
  black: 'black',
  white: 'white',
  grey: 'gray',
  gray: 'gray',
  silver: 'silver',
  navy: 'navy',
  blue: 'blue',
  pink: 'pink',
  green: 'green',
  yellow: 'yellow',
  orange: 'orange',
  purple: 'purple',
  brown: 'brown',
  beige: 'beige',
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Приводит значение из БД к id палитры или null, если это произвольная строка. */
export function normalizeProductColorToken(raw: string): string | null {
  const t = norm(raw);
  if (!t) return null;
  if (PALETTE_BY_ID.has(t)) return PALETTE_BY_ID.get(t)!.id;
  if (ALIASES[t]) return ALIASES[t];
  if (LABEL_TO_ID.has(t)) return LABEL_TO_ID.get(t)!;
  return null;
}

export type ProductColorVisual = {
  label: string;
  style: CSSProperties;
  ring: boolean;
};

/** Образец + подпись для отображения (витрина, корзина, админка). */
export function getProductColorVisual(stored: string): ProductColorVisual {
  const trimmed = String(stored).trim();
  if (!trimmed) {
    return {
      label: '—',
      style: { backgroundColor: '#e5e7eb' },
      ring: true,
    };
  }

  const id = normalizeProductColorToken(trimmed);
  if (id) {
    const e = PALETTE_BY_ID.get(id.toLowerCase());
    if (e) {
      return {
        label: e.label,
        style: { background: e.background },
        ring: Boolean(e.ring),
      };
    }
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
    return {
      label: trimmed.toUpperCase(),
      style: { backgroundColor: trimmed },
      ring: /^#(fff|ffff|ffffff|ffffffff)$/i.test(trimmed),
    };
  }

  return {
    label: trimmed,
    style: { backgroundColor: '#e5e7eb' },
    ring: true,
  };
}

export function paletteEntryById(id: string): ProductColorPaletteEntry | undefined {
  return PALETTE_BY_ID.get(norm(id));
}

/** Ключ для сравнения вариантов в корзине (id палитры или нижний регистр произвольного текста). */
export function canonicalProductColorKey(raw: string | undefined | null): string {
  const t = raw == null ? '' : String(raw).trim();
  if (!t) return '';
  const id = normalizeProductColorToken(t);
  if (id) return id;
  return t.toLowerCase();
}

export function productColorsRepresentSame(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  return canonicalProductColorKey(a) === canonicalProductColorKey(b);
}
