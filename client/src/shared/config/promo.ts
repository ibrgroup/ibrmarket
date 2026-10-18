/**
 * Конфигурация промо-акций и объявлений для TopBar
 * В будущем можно загружать с API
 */

export interface PromoConfig {
  id: string;
  text: string;
  href?: string;
  isActive: boolean;
  priority: number; // Чем выше, тем важнее
  icon?: string;
}

export const promoConfigs: PromoConfig[] = [
  {
    id: 'free-delivery',
    text: '',
    href: '/delivery',
    isActive: true,
    priority: 3,
  },
  {
    id: 'discount',
    text: '🔥 Скидки до -70% до конца месяца',
    isActive: false,
    priority: 2,
  },
  {
    id: 'new-products',
    text: '✨ Новые поступления каждый день',
    isActive: false,
    priority: 1,
  },
];

/**
 * Получить активное промо с наивысшим приоритетом
 */
export function getActivePromo(): PromoConfig | null {
  const activePromos = promoConfigs.filter((p) => p.isActive);
  if (activePromos.length === 0) return null;

  return activePromos.sort((a, b) => b.priority - a.priority)[0];
}
