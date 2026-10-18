import LogoModel from '../../models/logo.model.js';
import { LOGO_PLACEHOLDER } from '../data/index.js';

/**
 * @param {{}} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
  const existing = await LogoModel.countDocuments();
  if (existing > 0) return { name: 'Logos', count: 0, created: [] };

  const logo = await LogoModel.create({ logo: LOGO_PLACEHOLDER });
  ctx.logos = [logo];
  return { name: 'Logos', count: 1, created: [logo] };
}
