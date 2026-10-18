import CategoryModel from '../../models/category.model.js';
import { CATEGORY_TREE } from '../data/index.js';

/** @type {Map<string, { _id: any; name: string; parentCatName?: string; parentId?: any }>} */
const nameToCategory = new Map();

/**
 * Рекурсивно создаёт категории из дерева и заполняет nameToCategory (по имени листа).
 * @param {any[]} children
 * @param {{ _id: any; name: string } | null} parent
 * @param {any[]} outCreated
 */
async function createLevel(children, parent = null, outCreated = []) {
  if (!children || !children.length) return;
  for (const node of children) {
    const doc = await CategoryModel.create({
      name: node.name,
      images: node.images || [],
      parentCatName: parent ? parent.name : undefined,
      parentId: parent ? parent._id : null,
    });
    outCreated.push(doc);
    nameToCategory.set(node.name, {
      _id: doc._id,
      name: doc.name,
      parentCatName: parent?.name,
      parentId: parent?._id,
    });
    if (node.children?.length) {
      await createLevel(node.children, doc, outCreated);
    }
  }
}

/**
 * @param {{ categories: any[]; categoryByName: Map<string, any> }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
  const existing = await CategoryModel.countDocuments();
  if (existing > 0 && !config.options.clearExistingData) {
    const all = await CategoryModel.find().lean();
    ctx.categories = all;
    all.forEach((c) => ctx.categoryByName.set(c.name, c));
    return { name: 'Categories', count: all.length, created: [] };
  }

  nameToCategory.clear();
  const created = [];
  for (const root of CATEGORY_TREE) {
    const rootDoc = await CategoryModel.create({
      name: root.name,
      images: root.images || [],
      parentCatName: undefined,
      parentId: null,
    });
    nameToCategory.set(root.name, {
      _id: rootDoc._id,
      name: rootDoc.name,
      parentCatName: undefined,
      parentId: null,
    });
    created.push(rootDoc);
    if (root.children?.length) {
      await createLevel(root.children, rootDoc, created);
    }
  }

  const all = await CategoryModel.find().lean();
  ctx.categories = all;
  all.forEach((c) => ctx.categoryByName.set(c.name, c));
  return { name: 'Categories', count: created.length, created };
}
