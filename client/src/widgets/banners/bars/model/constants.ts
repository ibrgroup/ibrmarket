import type { IBannerItem } from './types';

export const DEFAULT_BANNERS: IBannerItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
    title: 'Мега распродажа!',
    subtitle: 'На все товары электроники',
    badge: 'ХИТ',
    ctaText: 'Купить сейчас',
    discount: '-70%',
    accentColor: 'orange',
  },
  {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80',
    title: 'Новая коллекция',
    subtitle: 'Эксклюзивные товары уже в продаже',
    badge: 'НОВИНКА',
    ctaText: 'Смотреть',
    discount: '-50%',
    accentColor: 'pink',
  },
  {
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
    title: 'Бесплатная доставка',
    subtitle: 'При заказе от 2000 ₽',
    ctaText: 'Заказать',
    accentColor: 'blue',
  },
  {
    image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1200&q=80',
    title: 'Только сегодня!',
    subtitle: 'Специальные предложения дня',
    badge: '24Ч',
    ctaText: 'Успеть',
    discount: '-40%',
    accentColor: 'green',
  },
];
