export interface IBannerItem {
  image?: string;
  video?: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaText: string;
  discount?: string;
  accentColor?: 'orange' | 'pink' | 'blue' | 'green';
}
