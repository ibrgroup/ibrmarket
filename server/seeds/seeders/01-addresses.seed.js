import AddressModel from '../../models/address.model.js';
import { RUSSIAN_CITIES, STREET_TEMPLATES, LANDMARKS } from '../data/index.js';

/**
 * @param {{ users: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
	if (!ctx.users.length) return { name: 'Addresses', count: 0, created: [] };

	const perUser = Math.max(0, config.seedData.addressesPerUser ?? 0);
	if (perUser === 0) return { name: 'Addresses', count: 0, created: [] };

	const created = [];
	for (const user of ctx.users) {
		if (user.role !== 'USER') continue;
		const numAddresses = perUser;
		for (let a = 0; a < numAddresses; a++) {
			const cityData = RUSSIAN_CITIES[(user._id.toString().length + a) % RUSSIAN_CITIES.length];
			const street = STREET_TEMPLATES[(user._id.toString().length + a) % STREET_TEMPLATES.length];
			const landmark = LANDMARKS[a % LANDMARKS.length];
			const seed = user._id.toString().slice(-6) + a;
			const mobile = `790${String(parseInt(seed, 36) % 100000000).padStart(8, '0')}`;
			const doc = await AddressModel.create({
				address_line1: `${street}, д. ${10 + a}`,
				city: cityData.city,
				state: cityData.state,
				pincode: cityData.pincode,
				country: 'Россия',
				mobile,
				landmark: landmark || undefined,
				addressType: a === 0 ? 'Home' : 'Office',
				userId: user._id,
				selected: a === 0,
				status: true,
			});
			created.push(doc);
		}
	}
	ctx.addresses = created;
	return { name: 'Addresses', count: created.length, created };
}
