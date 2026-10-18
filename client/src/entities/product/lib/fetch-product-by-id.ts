import { ProductService } from '@/shared/api/services/product-service';
import { mockProducts } from '../model/mock-data';
import type { Product } from '../model/types';
import { serverProductToProduct } from './adapters';

/** Загрузка товара по id (как в useProduct), для разовых вызовов вне хука. */
export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const response = await ProductService.getProductById(id);
    if (response.product) {
      return serverProductToProduct(response.product);
    }
    if (response.data) {
      return serverProductToProduct(response.data);
    }
    const mockProduct = mockProducts.find((product) => product._id === id);
    return mockProduct ?? null;
  } catch (e) {
    console.error('Ошибка загрузки товара:', e);
    const mockProduct = mockProducts.find((product) => product._id === id);
    return mockProduct ?? null;
  }
}
