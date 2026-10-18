import bcrypt from 'bcryptjs';
import UserModel from '../../models/user.model.js';
import { SEED_USERS } from '../data/index.js';

const DEFAULT_PASSWORD = 'user123';

/**
 * @param {{ users: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
  const adminData = {
    name: config.admin.name,
    email: config.admin.email,
    password: bcrypt.hashSync(config.admin.password, 10),
    role: 'ADMIN',
    verify_email: true,
    status: 'Active',
  };
  const admin = await UserModel.create(adminData);
  ctx.users.push(admin);

  if (config.defaultUser) {
    const defaultUser = await UserModel.create({
      ...config.defaultUser,
      password: bcrypt.hashSync(config.defaultUser.password, 10),
      verify_email: true,
      status: 'Active',
    });
    ctx.users.push(defaultUser);
  }

  const count = config.seedData.users ?? 0;
  if (count <= 0) return { name: 'Users', count: ctx.users.length, created: ctx.users };

  const toCreate = [];
  for (let i = 0; i < count; i++) {
    const base = SEED_USERS[i % SEED_USERS.length];
    const suffix = `${Date.now()}${i}`;
    toCreate.push({
      name: base.name,
      email: base.email.replace('@example.com', `+${suffix}@example.com`),
      password: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
      role: 'USER',
      verify_email: true,
      status: 'Active',
    });
  }
  const created = await UserModel.insertMany(toCreate);
  ctx.users.push(...created);

  return { name: 'Users', count: ctx.users.length, created };
}
