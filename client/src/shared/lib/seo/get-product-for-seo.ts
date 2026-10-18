import type { Product } from '@/entities/product';
import { ProductService } from '@/shared/api/services/product-service';
import { serverProductToProduct } from '@/entities/product/lib/adapters';

/**
 * Загружает данные товара на сервере для generateMetadata и JSON-LD.
 * Возвращает null при ошибке или отсутствии товара.
 */
export async function getProductForSeo(productId: string): Promise<Product | null> {
  if (!productId || typeof productId !== 'string') return null;
  try {
    const response = await ProductService.getProductById(productId);
    const raw = response?.product ?? response?.data ?? response;
    if (!raw || typeof raw !== 'object') return null;
    return serverProductToProduct(raw as Product);
  } catch {
    return null;
  }
}
