import { parseProductsFromApiResponse } from '@/entities/product/lib/parse-products-api-response';
import type { Product } from '@/entities/product/model/types';

export const VISUAL_SEARCH_SESSION_KEY = 'ibr.visual-search';

export type VisualSearchSession = {
  products: Product[];
  previewDataUrl: string;
  fileName: string;
  matchType?: string;
  savedAt: number;
};

export type VisualSearchResponse = {
  products: Product[];
  matchType?: string;
  message?: string;
};

export async function searchProductsByImage(file: File): Promise<VisualSearchResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/search/by-image', {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || payload?.error || 'Не удалось выполнить поиск по фото');
  }

  return {
    products: parseProductsFromApiResponse(payload),
    matchType: payload.matchType,
    message: payload.message,
  };
}

export function saveVisualSearchSession(session: VisualSearchSession) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(VISUAL_SEARCH_SESSION_KEY, JSON.stringify(session));
}

export function readVisualSearchSession(): VisualSearchSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(VISUAL_SEARCH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VisualSearchSession;
    if (!Array.isArray(parsed.products)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearVisualSearchSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(VISUAL_SEARCH_SESSION_KEY);
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}
