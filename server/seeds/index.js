import mongoose from 'mongoose';
import { getSeedConfig } from '../config/seed.config.js';
import UserModel from '../models/user.model.js';
import CategoryModel from '../models/category.model.js';
import ProductModel from '../models/product.model.js';
import OrderModel from '../models/order.model.js';
import AddressModel from '../models/address.model.js';
import CartModel from '../models/cart.model.js';
import WishlistModel from '../models/wishlist.model.js';
import MyListModel from '../models/myList.model.js';
import ReviewModel from '../models/reviews.model.js';
import NotificationModel from '../models/notification.model.js';
import NotificationAnalyticsModel from '../models/notificationAnalytics.model.js';
import BlogModel from '../models/blog.model.js';
import BannerV1Model from '../models/bannerV1.model.js';
import BannerList2Model from '../models/bannerList2.model.js';
import HomeSliderModel from '../models/homeSlider.model.js';
import LogoModel from '../models/logo.model.js';

import { run as runUsers } from './seeders/00-users.seed.js';
import { run as runAddresses } from './seeders/01-addresses.seed.js';
import { run as runCategories } from './seeders/02-categories.seed.js';
import { run as runProducts } from './seeders/03-products.seed.js';
import { run as runOrders } from './seeders/04-orders.seed.js';
import { run as runCarts } from './seeders/05-carts.seed.js';
import { run as runWishlists } from './seeders/06-wishlists.seed.js';
import { run as runMyLists } from './seeders/07-mylists.seed.js';
import { run as runReviews } from './seeders/08-reviews.seed.js';
import { run as runNotifications } from './seeders/09-notifications.seed.js';
import { run as runBlogs } from './seeders/10-blogs.seed.js';
import { run as runBanners } from './seeders/11-banners.seed.js';
import { run as runHomeSliders } from './seeders/12-homeSliders.seed.js';
import { run as runLogos } from './seeders/13-logos.seed.js';

const SEEDERS = [
  runUsers,
  runAddresses,
  runCategories,
  runProducts,
  runOrders,
  runCarts,
  runWishlists,
  runMyLists,
  runReviews,
  runNotifications,
  runBlogs,
  runBanners,
  runHomeSliders,
  runLogos,
];

const MODELS_FOR_CLEAR = [
  NotificationAnalyticsModel,
  NotificationModel,
  OrderModel,
  CartModel,
  WishlistModel,
  MyListModel,
  ReviewModel,
  AddressModel,
  ProductModel,
  CategoryModel,
  UserModel,
  BlogModel,
  BannerV1Model,
  BannerList2Model,
  HomeSliderModel,
  LogoModel,
];

/**
 * Очистка коллекций в порядке, учитывающем зависимости.
 */
async function clearAll(config) {
  if (!config.options.clearExistingData) return;
  console.log('⏳ Очистка существующих данных...');
  for (const Model of MODELS_FOR_CLEAR) {
    const name = Model.modelName || Model.collection?.collectionName || 'collection';
    await Model.deleteMany({});
    if (config.options.verbose) console.log(`   очищено: ${name}`);
  }
  console.log('✅ Очистка завершена');
}

/**
 * Контекст между сидерами: созданные сущности по типам.
 * @typedef {Object} SeedContext
 * @property {any[]} users
 * @property {any[]} addresses
 * @property {any[]} categories
 * @property {Map<string,any>} categoryByName
 * @property {any[]} products
 * @property {any[]} orders
 * @property {any[]} carts
 * @property {any[]} wishlists
 * @property {any[]} myLists
 * @property {any[]} reviews
 * @property {any[]} notifications
 */

/**
 * Запуск всех сидов.
 */
export async function seedDatabase() {
  const config = getSeedConfig();
  let conn;

  try {
    conn = await mongoose.connect(config.database.uri, config.database.options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    await clearAll(config);

    /** @type {SeedContext} */
    const ctx = {
      users: [],
      addresses: [],
      categories: [],
      categoryByName: new Map(),
      products: [],
      orders: [],
      carts: [],
      wishlists: [],
      myLists: [],
      reviews: [],
      notifications: [],
    };

    for (const runSeeder of SEEDERS) {
      const result = await runSeeder(ctx, config);
      console.log(`✅ ${result.name}: ${result.count}`);
    }

    console.log('\n🎉 База успешно наполнена тестовыми данными.');
    return ctx;
  } catch (err) {
    console.error('❌ Ошибка при сидировании:', err);
    throw err;
  } finally {
    if (conn) {
      try {
        await mongoose.disconnect();
        console.log('🔌 MongoDB disconnected');
      } catch (e) {
        console.error('❗ Ошибка отключения от MongoDB', e);
      }
    }
  }
}

export default seedDatabase;
