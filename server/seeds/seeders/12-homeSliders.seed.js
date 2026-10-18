import HomeSliderModel from '../../models/homeSlider.model.js';
import { HOME_SLIDER_IMAGES } from '../data/index.js';

/**
 * @param {{}} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
  const count = config.seedData.homeSliders ?? 0;
  if (count <= 0) return { name: 'HomeSliders', count: 0, created: [] };

  const imagesList = HOME_SLIDER_IMAGES.slice(0, Math.min(count, HOME_SLIDER_IMAGES.length));
  const toCreate = imagesList.map((images) => ({ images }));
  if (toCreate.length < count) {
    for (let i = toCreate.length; i < count; i++) {
      toCreate.push({
        images: ['https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920'],
      });
    }
  }
  const created = await HomeSliderModel.insertMany(toCreate);
  ctx.homeSliders = created;
  return { name: 'HomeSliders', count: created.length, created };
}
