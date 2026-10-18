'use client';

import { Product, mockProducts } from '@/entities/product';
import { useEffect, useState } from 'react';
import { fetchProductById } from './fetch-product-by-id';

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        if (!id) {
          setProduct(null);
          setError('Некорректный id товара.');
          return;
        }
        const p = await fetchProductById(id);
        if (!cancelled) {
          if (p) {
            setProduct(p);
          } else {
            setProduct(null);
            setError('Товар не найден.');
          }
        }
      } catch (err: any) {
        const mockProduct = mockProducts.find((product) => product._id === id);
        if (mockProduct && !cancelled) {
          setProduct(mockProduct);
          setError(null);
        } else if (!cancelled) {
          setProduct(null);
          setError(
            err instanceof Error
              ? err.message
              : typeof err === 'string'
                ? err
                : 'Ошибка загрузки товара',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { product, loading, error };
}
