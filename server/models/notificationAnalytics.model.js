import mongoose from 'mongoose';

const NotificationAnalyticsSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
		eventType: {
			type: String,
			enum: [
				'dropdown_opened',
				'dropdown_closed',
				'notification_click',
				'mark_read',
				'mark_all_read',
				'remove',
				'clear_all',
			],
			required: true,
			index: true,
		},
		meta: { type: Object },
	},
	{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

NotificationAnalyticsSchema.index({ userId: 1, createdAt: -1 });

const NotificationAnalyticsModel = mongoose.model(
	'notification_analytics',
	NotificationAnalyticsSchema
);

export default NotificationAnalyticsModel;
