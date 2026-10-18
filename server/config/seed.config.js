// Конфигурация для скрипта генерации сидов
import dotenv from 'dotenv';

// Загружаем переменные окружения
// Используем default config для поиска .env в текущей рабочей директории (server/)
// Это согласуется с connectDb.js и документацией, где указано server/.env
dotenv.config();

// Конфигурация по умолчанию
const defaultConfig = {
  // Подключение к базе данных
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ibr-client',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Количество записей для генерации (0 = не создавать)
  seedData: {
    users: parseInt(process.env.SEED_USERS_COUNT, 10) || 25,
    addressesPerUser: parseInt(process.env.SEED_ADDRESSES_PER_USER, 10) || 2,
    categories: 0, // 0 = использовать полное дерево из data (рекомендуется)
    products: parseInt(process.env.SEED_PRODUCTS_COUNT, 10) || 200,
    ordersPerUser: parseInt(process.env.SEED_ORDERS_PER_USER, 10) || 3,
    cartItemsPerUser: parseInt(process.env.SEED_CART_ITEMS, 10) || 5,
    wishlistItemsPerUser: parseInt(process.env.SEED_WISHLIST_ITEMS, 10) || 8,
    myListItemsPerUser: parseInt(process.env.SEED_MYLIST_ITEMS, 10) || 5,
    reviewsPerProduct: parseInt(process.env.SEED_REVIEWS_PER_PRODUCT, 10) || 4,
    notificationsPerUser: parseInt(process.env.SEED_NOTIFICATIONS_PER_USER, 10) || 10,
    blogs: parseInt(process.env.SEED_BLOGS_COUNT, 10) || 15,
    homeSliders: parseInt(process.env.SEED_HOME_SLIDERS, 10) || 5,
    bannerV1Count: parseInt(process.env.SEED_BANNER_V1_COUNT, 10) || 8,
    bannerList2Count: parseInt(process.env.SEED_BANNER_LIST2_COUNT, 10) || 6,
  },

  // Данные для администратора
  admin: {
    name: process.env.SEED_ADMIN_NAME || 'Admin User',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
    role: 'ADMIN',
  },

  // Данные для пользователя по умолчанию (отключено)
  defaultUser: null,

  // Дополнительные опции
  options: {
    // Удалять ли существующие данные перед заполнением
    clearExistingData: process.env.SEED_CLEAR_EXISTING === 'false' ? false : true,

    // Выводить ли подробный лог
    verbose: process.env.SEED_VERBOSE === 'true' ? true : false,
  },
};

// Валидация конфигурации
const validateConfig = (config) => {
  if (!config.database.uri) {
    throw new Error('Не указан URI базы данных в конфигурации сидов');
  }

  if (config.seedData.users < 0 || config.seedData.categories < 0 || config.seedData.products < 0) {
    throw new Error('Количество записей для сидов не может быть отрицательным');
  }

  if (!config.admin.email || !config.admin.password) {
    throw new Error('Не указаны обязательные данные для администратора');
  }

  return true;
};

// Получение конфигурации
const getSeedConfig = () => {
  const config = { ...defaultConfig };
  validateConfig(config);
  return config;
};

export { defaultConfig, getSeedConfig, validateConfig };
