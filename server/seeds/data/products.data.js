/**
 * Пул товаров для сидов. categoryKey — название листовой категории из categories.data.js
 * (например "Смартфоны", "Футболки и поло"), по нему товар привязывается к категории.
 */
export const PRODUCTS_POOL = [
  // Электроника — смартфоны и гаджеты
  {
    name: "Смартфон Apple iPhone 15 Pro 256GB",
    brand: "Apple",
    description: 'Титановый корпус, чип A17 Pro, камера 48 Мп, дисплей Super Retina XDR 6.1".',
    categoryKey: "Смартфоны",
  },
  {
    name: "Смартфон Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    description: 'S Pen в комплекте, камера 200 Мп, экран Dynamic AMOLED 2X 6.8".',
    categoryKey: "Смартфоны",
  },
  {
    name: "Смартфон Xiaomi 14 Pro",
    brand: "Xiaomi",
    description: "Snapdragon 8 Gen 3, камера Leica, зарядка 120 Вт.",
    categoryKey: "Смартфоны",
  },
  {
    name: "Умные часы Apple Watch Series 9",
    brand: "Apple",
    description: "Двойной тап, яркий экран, датчики здоровья и тренировок.",
    categoryKey: "Умные часы и браслеты",
  },
  {
    name: "Фитнес-браслет Xiaomi Band 8 Pro",
    brand: "Xiaomi",
    description: 'AMOLED-экран 1.74", мониторинг сна и пульса, 14 дней работы.',
    categoryKey: "Умные часы и браслеты",
  },
  {
    name: "Чехол книжка для iPhone 15",
    brand: "Spigen",
    description: "Защита от ударов, магнитная крышка для беспроводной зарядки.",
    categoryKey: "Чехлы и аксессуары",
  },
  // Компьютеры
  {
    name: 'Ноутбук Apple MacBook Pro 14" M3 Pro',
    brand: "Apple",
    description: "Чип M3 Pro, 18 ГБ RAM, SSD 512 ГБ, дисплей Liquid Retina XDR.",
    categoryKey: "Ноутбуки",
  },
  {
    name: "Ноутбук ASUS ROG Strix G16",
    brand: "ASUS",
    description: "Intel Core i7-13650HX, RTX 4060, 16 ГБ RAM, 512 ГБ SSD.",
    categoryKey: "Ноутбуки",
  },
  {
    name: "Моноблок Lenovo IdeaCentre AIO 5",
    brand: "Lenovo",
    description: '27" FHD, AMD Ryzen 5, 8 ГБ RAM, 256 ГБ SSD.',
    categoryKey: "Моноблоки",
  },
  {
    name: "Видеокарта NVIDIA GeForce RTX 4070",
    brand: "NVIDIA",
    description: "12 ГБ GDDR6X, трассировка лучей, DLSS 3.",
    categoryKey: "Комплектующие",
  },
  // ТВ и аудио
  {
    name: 'Телевизор Samsung 55" QLED 4K',
    brand: "Samsung",
    description: "QLED, HDR10+, Smart TV Tizen, 4 HDMI.",
    categoryKey: "Телевизоры",
  },
  {
    name: "Наушники Sony WH-1000XM5",
    brand: "Sony",
    description: "Шумоподавление, 30 часов работы, мультиподключение.",
    categoryKey: "Наушники",
  },
  {
    name: "Беспроводная колонка JBL Charge 5",
    brand: "JBL",
    description: "Водозащита IP67, до 20 часов работы, Power Bank.",
    categoryKey: "Колонки",
  },
  // Одежда мужская
  {
    name: "Футболка базовая хлопок",
    brand: "Uniqlo",
    description: "100% хлопок, классический крой, универсальная база.",
    categoryKey: "Футболки и поло",
  },
  {
    name: "Поло с коротким рукавом",
    brand: "Lacoste",
    description: "Пике, логотип крокодила, дышащая ткань.",
    categoryKey: "Футболки и поло",
  },
  {
    name: "Рубашка офисная классика",
    brand: "Massimo Dutti",
    description: "Хлопок, стрелка, под галстук.",
    categoryKey: "Рубашки",
  },
  {
    name: "Джинсы прямые с высокой посадкой",
    brand: "Levi's",
    description: "Хлопок с эластаном, классический крой 501.",
    categoryKey: "Брюки и джинсы",
  },
  {
    name: "Брюки чинос",
    brand: "Tommy Hilfiger",
    description: "Хлопок, стрелка, карманы по бокам.",
    categoryKey: "Брюки и джинсы",
  },
  {
    name: "Куртка парка зимняя",
    brand: "The North Face",
    description: "Утеплитель, капюшон, водоотталкивающая пропитка.",
    categoryKey: "Верхняя одежда",
  },
  // Одежда женская
  {
    name: "Платье миди летнее",
    brand: "ZARA",
    description: "Лён, свободный крой, без рукавов.",
    categoryKey: "Платья",
  },
  {
    name: "Блузка шёлковая",
    brand: "Mango",
    description: "Шёлк, воротник-стойка, на пуговицах.",
    categoryKey: "Блузки и рубашки",
  },
  {
    name: "Юбка карандаш",
    brand: "H&M",
    description: "Приталенная, до колена, офисный стиль.",
    categoryKey: "Юбки",
  },
  {
    name: "Пальто шерстяное",
    brand: "Max Mara",
    description: "Шерсть, однобортное, классический крой.",
    categoryKey: "Верхняя одежда",
  },
  // Обувь
  {
    name: "Кроссовки беговые",
    brand: "Nike",
    description: "Air Zoom, сетка, лёгкая подошва.",
    categoryKey: "Кроссовки",
  },
  {
    name: "Туфли оксфорды мужские",
    brand: "Clarks",
    description: "Кожа, классическая колодка, подошва из резины.",
    categoryKey: "Туфли",
  },
  {
    name: "Ботинки челси",
    brand: "Dr. Martens",
    description: "Кожа, резиновая подошва, боковая резинка.",
    categoryKey: "Ботинки",
  },
  {
    name: "Туфли-лодочки на каблуке",
    brand: "Tamaris",
    description: "Лаковая кожа, каблук 7 см, подкладка из кожи.",
    categoryKey: "Туфли",
  },
  {
    name: "Балетки кожаные",
    brand: "Rieker",
    description: "Мягкая подошва, эластичная стелька.",
    categoryKey: "Балетки",
  },
  {
    name: "Сапоги на молнии",
    brand: "Ecco",
    description: "Замша, утеплённые, устойчивый каблук.",
    categoryKey: "Сапоги",
  },
  // Бытовая техника
  {
    name: "Холодильник двухкамерный No Frost",
    brand: "Samsung",
    description: "Объём 352 л, инверторный компрессор, зона свежести.",
    categoryKey: "Холодильники",
  },
  {
    name: "Стиральная машина с сушкой",
    brand: "LG",
    description: "Загрузка 9 кг, паровая стирка, inverter.",
    categoryKey: "Стиральные машины",
  },
  {
    name: "Варочная панель газ/электричество",
    brand: "Bosch",
    description: "4 конфорки, чугунные решётки.",
    categoryKey: "Плиты и духовки",
  },
  {
    name: "Электрический чайник 1.7 л",
    brand: "Philips",
    description: "Закрытый нагреватель, отключение при кипении.",
    categoryKey: "Чайники и кофеварки",
  },
  {
    name: "Кофемашина капсульная",
    brand: "Nespresso",
    description: "19 бар, быстрый нагрев, пенка для капучино.",
    categoryKey: "Чайники и кофеварки",
  },
  {
    name: "Робот-пылесос с базой",
    brand: "Roborock",
    description: "Карта помещения, мытьё пола, автопарковка.",
    categoryKey: "Пылесосы",
  },
  {
    name: "Паровой утюг с вертикальным отпариванием",
    brand: "Tefal",
    description: "Пар до 240 г/мин, антикальк, подошва с керамикой.",
    categoryKey: "Утюги",
  },
  // Продукты
  {
    name: "Гречка ядрица 900 г",
    brand: "Мистраль",
    description: "Крупа гречневая первого сорта, варка 15–20 мин.",
    categoryKey: "Крупы и макароны",
  },
  {
    name: "Макароны спагетти 500 г",
    brand: "Barilla",
    description: "Из твёрдых сортов пшеницы, аль денте.",
    categoryKey: "Крупы и макароны",
  },
  {
    name: "Оливковое масло Extra Virgin 500 мл",
    brand: "Iberica",
    description: "Холодный отжим, нерафинированное.",
    categoryKey: "Масло и соусы",
  },
  {
    name: "Томатная паста 400 г",
    brand: "Pomodoro",
    description: "Без добавления сахара, густая.",
    categoryKey: "Масло и соусы",
  },
  {
    name: "Молоко 3.2% 1 л",
    brand: "Простоквашино",
    description: "Ультрапастеризованное, в бутылке.",
    categoryKey: "Молоко",
  },
  {
    name: "Сыр российский 45% 200 г",
    brand: "Домик в деревне",
    description: "Полутвёрдый, для бутербродов и нарезки.",
    categoryKey: "Сыр",
  },
  {
    name: "Йогурт натуральный 125 г",
    brand: "Активия",
    description: "Без добавленного сахара, с бифидобактериями.",
    categoryKey: "Йогурты",
  },
  {
    name: "Печенье овсяное 300 г",
    brand: "Бурёнкино",
    description: "С кусочками овсяных хлопьев.",
    categoryKey: "Печенье и выпечка",
  },
  {
    name: "Шоколад тёмный 70% 100 г",
    brand: "Lindt",
    description: "Швейцарский, без добавления молока.",
    categoryKey: "Шоколад",
  },
  {
    name: "Кешью жареный 200 г",
    brand: "Ореховия",
    description: "Солёный, в вакуумной упаковке.",
    categoryKey: "Орехи",
  },
  // Дом
  {
    name: "Комплект постельного белья 1.5",
    brand: "Икеа",
    description: "Хлопок, пододеяльник, простыня, 2 наволочки.",
    categoryKey: "Постельное бельё",
  },
  {
    name: "Полотенце банное 70x140 см",
    brand: "Home Sweet Home",
    description: "Махра 100% хлопок, плотность 500 г/м².",
    categoryKey: "Полотенца",
  },
  {
    name: "Шторы блэкаут 2 шт",
    brand: "Леруа Мерлен",
    description: "Затемняющие, крепление на люверсах.",
    categoryKey: "Шторы",
  },
  {
    name: "Настольная лампа LED",
    brand: "Xiaomi",
    description: "Регулировка яркости и температуры, USB.",
    categoryKey: "Вазы и свет",
  },
  {
    name: "Часы настенные кварцевые",
    brand: "Casio",
    description: "Циферблат 30 см, тихий ход.",
    categoryKey: "Часы",
  },
  // Красота
  {
    name: "Крем увлажняющий для лица 50 мл",
    brand: "La Roche-Posay",
    description: "Гиалуроновая кислота, для нормальной и сухой кожи.",
    categoryKey: "Кремы",
  },
  {
    name: "Сыворотка витамин C 30 мл",
    brand: "The Ordinary",
    description: "Осветление, антиоксидант, для всех типов кожи.",
    categoryKey: "Сыворотки",
  },
  {
    name: "Маска тканевая увлажняющая",
    brand: "Garnier",
    description: "1 маска в упаковке, 15 минут.",
    categoryKey: "Маски",
  },
  {
    name: "Гель для душа 250 мл",
    brand: "Nivea",
    description: "Морская свежесть, увлажняющий.",
    categoryKey: "Гели для душа",
  },
  {
    name: "Дезодорант-антиперспирант 50 мл",
    brand: "Rexona",
    description: "Сухой спрей, 48 часов защиты.",
    categoryKey: "Дезодоранты",
  },
  {
    name: "Туалетная вода женская 50 мл",
    brand: "Chanel",
    description: "Chanel Coco Mademoiselle, цветочно-восточный букет.",
    categoryKey: "Женская",
  },
  {
    name: "Туалетная вода мужская 100 мл",
    brand: "Dior",
    description: "Dior Sauvage, свежий древесно-пряный.",
    categoryKey: "Мужская",
  },
  // Спорт
  {
    name: "Беговая дорожка электрическая",
    brand: "Proxima",
    description: "Скорость до 12 км/ч, складываемая, дисплей.",
    categoryKey: "Кардио",
  },
  {
    name: "Гантели неопрен 2 кг пара",
    brand: "Torres",
    description: "Неопреновое покрытие, удобный хват.",
    categoryKey: "Силовые",
  },
  {
    name: "Коврик для йоги 6 мм",
    brand: "Reebok",
    description: "Антискользящий, 173x61 см.",
    categoryKey: "Аксессуары",
  },
  {
    name: "Футболка для фитнеса",
    brand: "Adidas",
    description: "Клималайт, влагоотведение.",
    categoryKey: "Футболки",
  },
  { name: "Шорты для бега", brand: "Nike", description: "Лёгкие, карман для ключей.", categoryKey: "Шорты" },
  // Книги и канц
  {
    name: "Роман «Мастер и Маргарита»",
    brand: "АСТ",
    description: "М. Булгаков, твёрдый переплёт.",
    categoryKey: "Художественная литература",
  },
  {
    name: "Сборник сказок для детей",
    brand: "Росмэн",
    description: "Красная Шапочка, Гадкий утёнок и др.",
    categoryKey: "Детская литература",
  },
  {
    name: "Учебник математики 5 класс",
    brand: "Просвещение",
    description: "ФГОС, в 2 частях.",
    categoryKey: "Учебники",
  },
  {
    name: "Тетрадь 96 листов клетка",
    brand: "Hatber",
    description: "Обложка картон, формат A5.",
    categoryKey: "Тетради и блокноты",
  },
  {
    name: "Ручка шариковая синяя",
    brand: "Pilot",
    description: "Толщина 0.7 мм, колпачок.",
    categoryKey: "Ручки и карандаши",
  },
  {
    name: "Папка-регистратор А4",
    brand: "Brauberg",
    description: "На 4 кольцах, 75 мм, с карманом.",
    categoryKey: "Папки и архиваторы",
  },
  // Зоотовары
  {
    name: "Корм для взрослых собак 15 кг",
    brand: "Royal Canin",
    description: "Для средних пород, с курицей.",
    categoryKey: "Для собак",
  },
  {
    name: "Корм для кошек стерилизованных 10 кг",
    brand: "Purina Pro Plan",
    description: "С лососем, контроль веса.",
    categoryKey: "Для кошек",
  },
  {
    name: "Корм для грызунов 500 г",
    brand: "Versele-Laga",
    description: "Смесь злаков и овощей.",
    categoryKey: "Для грызунов",
  },
  {
    name: "Миска двойная керамика",
    brand: "Triol",
    description: "Для воды и корма, 2x0.5 л.",
    categoryKey: "Миски и поилки",
  },
  {
    name: "Игрушка мяч с пищалкой",
    brand: "Trixie",
    description: "Резина, для собак средних пород.",
    categoryKey: "Игрушки",
  },
  {
    name: "Наполнитель древесный 10 л",
    brand: "Fresh Step",
    description: "Комкующийся, для кошачьих туалетов.",
    categoryKey: "Наполнители",
  },
];
