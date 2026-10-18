import type { Product } from '@/entities';
import { ProductCard } from '@/entities/product';

interface ProductsGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  isInCart: (product: Product) => boolean;
  onCartClick: (product: Product) => void;
}

export function ProductsGrid({
  products,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isInCart,
  onCartClick,
}: ProductsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-0.5 md:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {products.map((product: Product) => (
        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isInWishlist={isInWishlist}
          isInCart={isInCart}
          onCartClick={onCartClick}
        />
      ))}
    </div>
  );
}
