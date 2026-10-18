import { WishlistPage } from '@/views/account/wishlist/WishlistPage';

/**
 * Wishlist page - PUBLIC route (supports guest mode)
 *
 * NOTE: This route is intentionally NOT protected by middleware or layout
 * - Guest users can access and use localStorage wishlist
 * - Authenticated users see server-backed wishlist
 * - Merge happens only on login (not on page reload)
 */
export default function WishlistPageRoute() {
  return <WishlistPage />;
}
