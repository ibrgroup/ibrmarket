/**
 * Разбор ответа DaData suggest/address для заполнения полей адреса на бэкенде.
 * @see https://confluence.hflabs.ru/pages/viewpage.action?pageId=199972093
 */

export interface DadataStructuredAddress {
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  /** Строка подсказки (как в DaData) */
  value: string;
}

type DaDataAddr = Record<string, string | null | undefined>;

function str(v: unknown): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function buildLine1(d: DaDataAddr): string {
  const parts: string[] = [];
  const street =
    str(d.street_with_type) || [str(d.street_type), str(d.street)].filter(Boolean).join(' ').trim();
  if (street) parts.push(street);
  const house = str(d.house);
  if (house) {
    const ht = str(d.house_type) || 'д';
    parts.push(`${ht} ${house}`.replace(/\s+/g, ' ').trim());
  }
  const block = str(d.block);
  if (block) {
    const bt = str(d.block_type) || 'к';
    parts.push(`${bt} ${block}`.trim());
  }
  const flat = str(d.flat);
  if (flat) {
    const ft = str(d.flat_type) || 'кв';
    parts.push(`${ft} ${flat}`.trim());
  }
  if (parts.length === 0) {
    const settlement = str(d.settlement_with_type);
    if (settlement) {
      parts.push(settlement);
      if (house) parts.push(`${str(d.house_type) || 'д'} ${house}`.trim());
    }
  }
  return parts.join(', ');
}

/**
 * Из выбранной подсказки DaData собирает поля для API адреса.
 * Возвращает null, если в подсказке нет объекта data (нельзя надёжно разбить).
 */
export function structuredAddressFromDadataSuggestion(suggestion: {
  value?: string;
  unrestricted_value?: string;
  data?: unknown;
}): DadataStructuredAddress | null {
  const raw = suggestion.data;
  if (!raw || typeof raw !== 'object') return null;

  const d = raw as DaDataAddr;
  let line1 = buildLine1(d);
  const value = str(suggestion.unrestricted_value) || str(suggestion.value);
  if (!line1 && value) {
    line1 = value.replace(/^\d{6}\s*,\s*/u, '').trim();
  }
  if (!line1) return null;

  let city = str(d.city) || str(d.settlement) || str(d.area) || '';
  if (!city && str(d.region) === 'Москва') city = 'Москва';
  if (!city && str(d.region) === 'Санкт-Петербург') city = 'Санкт-Петербург';

  const state = str(d.region_with_type) || str(d.region) || city || '';

  let pincode = str(d.postal_code).replace(/\D/g, '');
  if (pincode.length > 6) pincode = pincode.slice(0, 6);
  if (!pincode) {
    const head = str(suggestion.unrestricted_value) || str(suggestion.value);
    const fromLabel = head.match(/^(\d{5,6})\s*,/u);
    if (fromLabel) pincode = fromLabel[1];
  }

  const country = str(d.country) || 'Россия';

  if (!city || !pincode || pincode.length < 5) {
    return null;
  }

  return {
    address_line1: line1.slice(0, 200),
    city: city.slice(0, 100),
    state: state.slice(0, 100) || city.slice(0, 100),
    pincode,
    country: country.slice(0, 100),
    value: value || line1,
  };
}

export function mergeAddressLine(base: string, extra: string | undefined): string {
  const a = base.trim();
  const b = (extra ?? '').trim();
  if (!b) return a;
  if (!a) return b;
  if (a.toLowerCase().includes(b.toLowerCase())) return a;
  return `${a}, ${b}`;
}
