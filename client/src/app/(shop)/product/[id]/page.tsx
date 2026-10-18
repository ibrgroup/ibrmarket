import { getProductImage } from '@/entities/product/lib/utils';
import { ProductPage } from '@/views/product/ProductPage';
import { getBaseUrl } from '@/shared/config/site';
import { getProductForSeo } from '@/shared/lib/seo';
import { ProductJsonLd } from '@/shared/ui/seo/ProductJsonLd';
import type { Metadata } from 'next';

const BASE_URL = getBaseUrl();

function stripHtml(html: string, maxLength: number = 160): string {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForSeo(id);

  if (!product) {
    return {
      title: 'Товар',
      robots: { index: false, follow: true },
    };
  }

  const title = product.name;
  const description = stripHtml(product.description || '', 160);
  const imageUrl = getProductImage(product);
  const absoluteImage =
    imageUrl && imageUrl !== '/placeholder.png'
      ? imageUrl.startsWith('http')
        ? imageUrl
        : `${BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
      : undefined;
  const productUrl = `${BASE_URL}/product/${product._id}`;

  return {
    title,
    description: description || `Купить ${product.name} в IBR-MARKET. Цена: ${product.price} ₽`,
    openGraph: {
      title: `${product.name} | IBR-MARKET`,
      description: description || undefined,
      url: productUrl,
      type: 'website',
      images: absoluteImage
        ? [{ url: absoluteImage, width: 800, height: 800, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | IBR Market`,
      description: description || undefined,
    },
    alternates: {
      canonical: productUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductForSeo(id);

  const jsonLdData =
    product &&
    ({
      _id: product._id,
      name: product.name,
      description: product.description || '',
      imageUrl: getProductImage(product),
      price: product.price,
      countInStock: product.countInStock ?? 0,
      brand: product.brand,
      rating: product.rating,
      reviewCount: product.reviewCount,
    } as const);

  return (
    <>
      {jsonLdData && <ProductJsonLd product={jsonLdData} />}
      <ProductPage />
    </>
  );
}
