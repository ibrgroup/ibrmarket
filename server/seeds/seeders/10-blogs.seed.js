import BlogModel from '../../models/blog.model.js';
import { BLOG_POSTS } from '../data/index.js';

/**
 * @param {{}} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
  const count = config.seedData.blogs ?? 0;
  if (count <= 0) return { name: 'Blogs', count: 0, created: [] };

  const toCreate = BLOG_POSTS.slice(0, Math.min(count, BLOG_POSTS.length));
  if (toCreate.length < count) {
    for (let i = toCreate.length; i < count; i++) {
      toCreate.push({
        title: `Статья блога ${i + 1}`,
        description: `Описание статьи ${i + 1} для тестовых данных.`,
        images: ['https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800'],
      });
    }
  }
  const created = await BlogModel.insertMany(toCreate);
  ctx.blogs = created;
  return { name: 'Blogs', count: created.length, created };
}
