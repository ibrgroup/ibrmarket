import BannerV1Model from '../../models/bannerV1.model.js';
import BannerList2Model from '../../models/bannerList2.model.js';
import {
  BANNER_V1_ALIGN,
  BANNER_V1_TITLES,
  BANNER_LIST2_IMAGE_PLACEHOLDERS,
} from '../data/index.js';

/**
 * @param {{ categories: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
  const v1Count = config.seedData.bannerV1Count ?? 0;
  const list2Count = config.seedData.bannerList2Count ?? 0;

  const createdV1 = [];
  if (v1Count > 0) {
    const catId = ctx.categories?.length ? String(ctx.categories[0]._id) : '';
    for (let i = 0; i < v1Count; i++) {
      const banner = await BannerV1Model.create({
        bannerTitle: BANNER_V1_TITLES[i % BANNER_V1_TITLES.length],
        images: [`https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&sig=${i}`],
        catId,
        subCatId: '',
        thirdsubCatId: '',
        price: 999 + i * 100,
        alignInfo: BANNER_V1_ALIGN[i % BANNER_V1_ALIGN.length],
      });
      createdV1.push(banner);
    }
  }

  const createdList2 = [];
  if (list2Count > 0) {
    const catId = ctx.categories?.length ? String(ctx.categories[0]._id) : '';
    for (let i = 0; i < list2Count; i++) {
      const banner = await BannerList2Model.create({
        images: [BANNER_LIST2_IMAGE_PLACEHOLDERS[i % BANNER_LIST2_IMAGE_PLACEHOLDERS.length]],
        catId,
        subCatId: '',
        thirdsubCatId: '',
      });
      createdList2.push(banner);
    }
  }

  ctx.bannerV1 = createdV1;
  ctx.bannerList2 = createdList2;
  return {
    name: 'Banners',
    count: createdV1.length + createdList2.length,
    created: [...createdV1, ...createdList2],
  };
}
