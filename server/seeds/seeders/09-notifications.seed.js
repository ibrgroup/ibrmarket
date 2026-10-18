import NotificationModel from '../../models/notification.model.js';

const NOTIFICATION_TEMPLATES = [
	{ type: 'order', title: 'Заказ оформлен', message: 'Ваш заказ №%d принят в обработку.' },
	{ type: 'order', title: 'Заказ доставлен', message: 'Заказ №%d доставлен. Спасибо за покупку!' },
	{ type: 'payment', title: 'Оплата прошла успешно', message: 'Оплата по заказу №%d получена.' },
	{ type: 'delivery', title: 'Заказ в пути', message: 'Заказ №%d передан в службу доставки.' },
	{
		type: 'product',
		title: 'Скидка на избранное',
		message: 'На товары из вашего списка желаний действует скидка.',
	},
	{
		type: 'promotional',
		title: 'Акция недели',
		message: 'Специальные предложения на электронику до конца недели.',
	},
	{
		type: 'system',
		title: 'Обновление приложения',
		message: 'Доступна новая версия. Обновите приложение для лучшего опыта.',
	},
	{
		type: 'security',
		title: 'Вход в аккаунт',
		message: 'Выполнен вход в аккаунт с нового устройства.',
	},
];

/**
 * @param {{ users: any[] }} ctx
 * @param {import('../../config/seed.config.js').defaultConfig} config
 */
export async function run(ctx, config) {
	const perUser = config.seedData.notificationsPerUser ?? 0;
	if (perUser <= 0 || !ctx.users?.length) return { name: 'Notifications', count: 0, created: [] };

	const regularUsers = ctx.users.filter((u) => u.role === 'USER');
	if (!regularUsers.length) return { name: 'Notifications', count: 0, created: [] };

	const toInsert = [];
	for (const user of regularUsers) {
		for (let n = 0; n < perUser; n++) {
			const tpl = NOTIFICATION_TEMPLATES[n % NOTIFICATION_TEMPLATES.length];
			const orderNum = 1000 + n;
			const message = tpl.message.replace('%d', String(orderNum));
			toInsert.push({
				userId: user._id,
				title: tpl.title,
				message,
				type: tpl.type,
				read: Math.random() > 0.5,
				actionUrl: tpl.type === 'order' ? `/orders/${orderNum}` : undefined,
			});
		}
	}
	const created = toInsert.length ? await NotificationModel.insertMany(toInsert) : [];
	ctx.notifications = created;
	return { name: 'Notifications', count: created.length, created };
}
