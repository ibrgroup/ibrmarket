import NotificationAnalytics from '../models/notificationAnalytics.model.js';

export const recordEvent = async (req, res) => {
	try {
		const userId = req.userId;
		const { eventType, meta } = req.body || {};
		if (!eventType) return res.status(400).json({ message: 'eventType is required' });
		const created = await NotificationAnalytics.create({ userId, eventType, meta });
		return res.status(201).json(created);
	} catch (e) {
		return res.status(500).json({ message: 'Failed to record event', error: String(e) });
	}
};

export const getSummary = async (req, res) => {
	try {
		const userId = req.userId;
		const days = Math.min(Number(req.query.days || 7), 90);
		const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		const pipeline = [
			{ $match: { userId, createdAt: { $gte: since } } },
			{ $group: { _id: '$eventType', count: { $sum: 1 } } },
			{ $project: { eventType: '$_id', _id: 0, count: 1 } },
		];

		const byType = await NotificationAnalytics.aggregate(pipeline);
		return res.json({ days, byType });
	} catch (e) {
		return res.status(500).json({ message: 'Failed to summarize analytics', error: String(e) });
	}
};
