import type { Product } from '@/entities';
import ProductList from '@/features/product-list/ProductList';

interface ProductsListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  isInCart: (product: Product) => boolean;
  onCartClick: (product: Product) => void;
}

export function ProductsList({
  products,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isInCart,
  onCartClick,
}: ProductsListProps) {
  return (
    <ProductList
      products={products}
      onAddToCart={onAddToCart}
      onToggleWishlist={onToggleWishlist}
      isInWishlist={isInWishlist}
      isInCart={isInCart}
      onCartClick={onCartClick}
    />
  );
}
