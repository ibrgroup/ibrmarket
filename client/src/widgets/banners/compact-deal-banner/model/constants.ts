import type { IDeal } from './types';

export const DEFAULT_DEALS: IDeal[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&q=80',
    title: 'Суперцены',
    subtitle: 'На товары для дома',
    buttonText: 'Купить',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&q=80',
    title: 'Топ недели',
    subtitle: 'Самые популярные',
    buttonText: 'Смотреть',
    color: 'from-purple-600 to-pink-600',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=600&q=80',
    title: '2 по цене 1',
    subtitle: 'Акция на одежду',
    buttonText: 'Выбрать',
    color: 'from-orange-600 to-red-600',
  },
];
