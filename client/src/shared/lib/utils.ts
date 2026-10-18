import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** MongoDB ObjectId: 24 hex chars. Use for product/wishlist links so we never use temp ids (e.g. Date.now()). */
export function isValidMongoId(id: string | null | undefined): boolean {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

/** Returns product id suitable for /product/[id] — only valid ObjectId, never temp id. */
export function getProductLinkId(item: { productId?: string | null; _id?: string | null }): string | null {
  if (isValidMongoId(item.productId)) return item.productId!;
  if (isValidMongoId(item._id)) return item._id!;
  return null;
}
