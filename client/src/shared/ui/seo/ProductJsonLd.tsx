import { getBaseUrl } from '@/shared/config/site';

function toAbsoluteImageUrl(src: string): string {
  if (!src || src.startsWith('http://') || src.startsWith('https://')) return src;
  const base = getBaseUrl();
  return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
}

/** Данные товара для JSON-LD (без зависимости от entities) */
export interface ProductJsonLdData {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  countInStock: number;
  brand?: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductJsonLdProps {
  product: ProductJsonLdData;
}

/**
 * JSON-LD разметка типа Product для страницы товара.
 * Даёт возможность отображения цены, рейтинга и наличия в поисковой выдаче.
 */
export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const baseUrl = getBaseUrl();
  const productUrl = `${baseUrl}/product/${product._id}`;
  const imageUrl =
    product.imageUrl && product.imageUrl !== '/placeholder.png'
      ? toAbsoluteImageUrl(product.imageUrl)
      : '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      typeof product.description === 'string'
        ? product.description.replace(/<[^>]*>/g, '').slice(0, 5000)
        : '',
    url: productUrl,
    ...(imageUrl && { image: imageUrl }),
    sku: product._id,
    ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'RUB',
      price: product.price,
      availability:
        product.countInStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(typeof product.rating === 'number' &&
      product.rating > 0 &&
      (product.reviewCount ?? 0) > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount ?? 0,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
