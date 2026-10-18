import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
		title: { type: String, required: true },
		message: { type: String, required: true },
		type: {
			type: String,
			enum: ['order', 'product', 'system', 'promotional', 'security', 'payment', 'delivery'],
			required: true,
			index: true,
		},
		read: { type: Boolean, default: false, index: true },
		actionUrl: { type: String },
		data: { type: Object },
	},
	{ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

const NotificationModel = mongoose.model('notification', NotificationSchema);

export default NotificationModel;
