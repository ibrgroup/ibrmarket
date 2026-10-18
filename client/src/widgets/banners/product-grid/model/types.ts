export interface IProduct {
  id: string;
  image: string;
  title: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  size?: 'small' | 'medium' | 'large';
}
