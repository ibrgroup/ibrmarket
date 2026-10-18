/**
 * Дерево категорий для сидов (родитель → подкатегория → третьий уровень).
 * Структура: { name, image?, children?: [ { name, children?: [...] } ] }
 */
export const CATEGORY_TREE = [
  {
    name: 'Электроника',
    images: ['https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'],
    children: [
      {
        name: 'Смартфоны и гаджеты',
        children: [
          { name: 'Смартфоны' },
          { name: 'Чехлы и аксессуары' },
          { name: 'Умные часы и браслеты' },
        ],
      },
      {
        name: 'Компьютеры и ноутбуки',
        children: [
          { name: 'Ноутбуки' },
          { name: 'Моноблоки' },
          { name: 'Комплектующие' },
        ],
      },
      {
        name: 'ТВ и аудио',
        children: [
          { name: 'Телевизоры' },
          { name: 'Наушники' },
          { name: 'Колонки' },
        ],
      },
    ],
  },
  {
    name: 'Одежда',
    images: ['https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'],
    children: [
      {
        name: 'Мужская одежда',
        children: [
          { name: 'Футболки и поло' },
          { name: 'Рубашки' },
          { name: 'Брюки и джинсы' },
          { name: 'Верхняя одежда' },
        ],
      },
      {
        name: 'Женская одежда',
        children: [
          { name: 'Платья' },
          { name: 'Блузки и рубашки' },
          { name: 'Юбки' },
          { name: 'Верхняя одежда' },
        ],
      },
      {
        name: 'Детская одежда',
        children: [
          { name: 'Для мальчиков' },
          { name: 'Для девочек' },
          { name: 'Для малышей' },
        ],
      },
    ],
  },
  {
    name: 'Обувь',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
    children: [
      {
        name: 'Мужская обувь',
        children: [
          { name: 'Кроссовки' },
          { name: 'Туфли' },
          { name: 'Ботинки' },
        ],
      },
      {
        name: 'Женская обувь',
        children: [
          { name: 'Туфли' },
          { name: 'Балетки' },
          { name: 'Сапоги' },
        ],
      },
    ],
  },
  {
    name: 'Бытовая техника',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    children: [
      {
        name: 'Крупная техника',
        children: [
          { name: 'Холодильники' },
          { name: 'Стиральные машины' },
          { name: 'Плиты и духовки' },
        ],
      },
      {
        name: 'Малая техника',
        children: [
          { name: 'Чайники и кофеварки' },
          { name: 'Пылесосы' },
          { name: 'Утюги' },
        ],
      },
    ],
  },
  {
    name: 'Продукты питания',
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'],
    children: [
      {
        name: 'Бакалея',
        children: [
          { name: 'Крупы и макароны' },
          { name: 'Масло и соусы' },
          { name: 'Консервы' },
        ],
      },
      {
        name: 'Молочные продукты',
        children: [
          { name: 'Молоко' },
          { name: 'Сыр' },
          { name: 'Йогурты' },
        ],
      },
      {
        name: 'Снеки и сладости',
        children: [
          { name: 'Печенье и выпечка' },
          { name: 'Шоколад' },
          { name: 'Орехи' },
        ],
      },
    ],
  },
  {
    name: 'Дом и интерьер',
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
    children: [
      {
        name: 'Текстиль',
        children: [
          { name: 'Постельное бельё' },
          { name: 'Полотенца' },
          { name: 'Шторы' },
        ],
      },
      {
        name: 'Декор',
        children: [
          { name: 'Вазы и свет' },
          { name: 'Часы' },
          { name: 'Картины' },
        ],
      },
    ],
  },
  {
    name: 'Красота и здоровье',
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'],
    children: [
      {
        name: 'Уход за лицом',
        children: [
          { name: 'Кремы' },
          { name: 'Сыворотки' },
          { name: 'Маски' },
        ],
      },
      {
        name: 'Уход за телом',
        children: [
          { name: 'Гели для душа' },
          { name: 'Лосьоны' },
          { name: 'Дезодоранты' },
        ],
      },
      {
        name: 'Парфюмерия',
        children: [
          { name: 'Женская' },
          { name: 'Мужская' },
        ],
      },
    ],
  },
  {
    name: 'Спорт и отдых',
    images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'],
    children: [
      {
        name: 'Тренажёры',
        children: [
          { name: 'Кардио' },
          { name: 'Силовые' },
          { name: 'Аксессуары' },
        ],
      },
      {
        name: 'Одежда для спорта',
        children: [
          { name: 'Футболки' },
          { name: 'Шорты' },
          { name: 'Куртки' },
        ],
      },
    ],
  },
  {
    name: 'Книги и канцтовары',
    images: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'],
    children: [
      {
        name: 'Книги',
        children: [
          { name: 'Художественная литература' },
          { name: 'Детская литература' },
          { name: 'Учебники' },
        ],
      },
      {
        name: 'Канцтовары',
        children: [
          { name: 'Тетради и блокноты' },
          { name: 'Ручки и карандаши' },
          { name: 'Папки и архиваторы' },
        ],
      },
    ],
  },
  {
    name: 'Зоотовары',
    images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'],
    children: [
      {
        name: 'Корм',
        children: [
          { name: 'Для собак' },
          { name: 'Для кошек' },
          { name: 'Для грызунов' },
        ],
      },
      {
        name: 'Аксессуары',
        children: [
          { name: 'Миски и поилки' },
          { name: 'Игрушки' },
          { name: 'Наполнители' },
        ],
      },
    ],
  },
];
