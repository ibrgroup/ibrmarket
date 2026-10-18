/** Единый справочник размеров: в БД храним стабильный `id`, везде показываем `label`. */

export type ProductSizePaletteEntry = {
  id: string;
  label: string;
};

const LETTER_SIZES: ProductSizePaletteEntry[] = [
  { id: 'xxs', label: 'XXS' },
  { id: 'xs', label: 'XS' },
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
  { id: 'xl', label: 'XL' },
  { id: 'xxl', label: 'XXL' },
  { id: 'xxxl', label: '3XL' },
  { id: 'xxxxl', label: '4XL' },
  { id: 'one', label: 'Универсальный' },
];

const CLOTHING_NUMS = [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62] as const;
const clothingNumeric: ProductSizePaletteEntry[] = CLOTHING_NUMS.map((n) => ({
  id: `c${n}`,
  label: String(n),
}));

const shoeSizes: ProductSizePaletteEntry[] = [];
for (let n = 35; n <= 46; n++) {
  shoeSizes.push({ id: `e${n}`, label: `${n} (EU)` });
}

const KIDS_HEIGHTS = [
  80, 86, 92, 98, 104, 110, 116, 122, 128, 134, 140, 146, 152, 158, 164,
] as const;
const kidsSizes: ProductSizePaletteEntry[] = KIDS_HEIGHTS.map((n) => ({
  id: `k${n}`,
  label: `${n} см`,
}));

export const PRODUCT_SIZE_PALETTE: ProductSizePaletteEntry[] = [
  ...LETTER_SIZES,
  ...clothingNumeric,
  ...shoeSizes,
  ...kidsSizes,
];

const PALETTE_BY_ID = new Map(PRODUCT_SIZE_PALETTE.map((e) => [e.id.toLowerCase(), e]));

const LABEL_TO_ID = new Map<string, string>();
for (const e of PRODUCT_SIZE_PALETTE) {
  LABEL_TO_ID.set(e.label.toLowerCase().trim(), e.id);
}

const CLOTHING_SET = new Set(CLOTHING_NUMS.map(String));
const KIDS_SET = new Set(KIDS_HEIGHTS.map(String));

const ALIASES: Record<string, string> = {
  хxs: 'xxs',
  ххs: 'xxs',
  хс: 'xs',
  с: 's',
  м: 'm',
  л: 'l',
  хл: 'xl',
  ххл: 'xxl',
  хххл: 'xxxl',
  больше: 'xxxxl',
  унив: 'one',
  универсальный: 'one',
  уни: 'one',
  onesize: 'one',
  'one size': 'one',
  'one-size': 'one',
  os: 'one',
  бесразмерный: 'one',
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Число: сначала рост детский и одежда (пересечение с обувью — за одежду), затем EU 35–46. */
function tryNormalizeNumericToken(t: string): string | null {
  if (!/^\d{2,3}$/.test(t)) return null;
  if (KIDS_SET.has(t)) return `k${t}`;
  if (CLOTHING_SET.has(t)) return `c${t}`;
  const n = parseInt(t, 10);
  if (t.length === 2 && n >= 35 && n <= 46) return `e${n}`;
  return null;
}

/** EU 42, 42eu, eu-42 */
function tryNormalizeEuShoe(t: string): string | null {
  const m = t.match(/^(?:eu|размер)?[-\s]*(\d{2})$/i) || t.match(/^(\d{2})\s*eu$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n >= 35 && n <= 46) return `e${n}`;
  return null;
}

export function normalizeProductSizeToken(raw: string): string | null {
  let t = norm(raw);
  if (!t) return null;

  if (PALETTE_BY_ID.has(t)) return PALETTE_BY_ID.get(t)!.id;

  const eu = tryNormalizeEuShoe(t);
  if (eu) return eu;

  const num = tryNormalizeNumericToken(t);
  if (num) return num;

  if (ALIASES[t]) return ALIASES[t];

  if (LABEL_TO_ID.has(t)) return LABEL_TO_ID.get(t)!;

  const collapsed = t.replace(/\s+/g, '');
  if (collapsed !== t) return normalizeProductSizeToken(collapsed);

  return null;
}

export function getProductSizeLabel(stored: string): string {
  const trimmed = String(stored).trim();
  if (!trimmed) return '—';
  const id = normalizeProductSizeToken(trimmed);
  if (id) {
    const e = PALETTE_BY_ID.get(id.toLowerCase());
    if (e) return e.label;
  }
  return trimmed;
}

export function canonicalProductSizeKey(raw: string | undefined | null): string {
  const t = raw == null ? '' : String(raw).trim();
  if (!t) return '';
  const id = normalizeProductSizeToken(t);
  if (id) return id;
  return t.toLowerCase();
}

export function productSizesRepresentSame(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  return canonicalProductSizeKey(a) === canonicalProductSizeKey(b);
}

export function paletteSizeEntryById(id: string): ProductSizePaletteEntry | undefined {
  return PALETTE_BY_ID.get(norm(id));
}
