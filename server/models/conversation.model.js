import mongoose from 'mongoose';

/**
 * Диалоги: обращение к владельцу (support; отвечают сотрудники — STAFF_ROLES) или peer.
 */
const conversationSchema = new mongoose.Schema(
	{
		kind: {
			type: String,
			enum: ['support', 'peer'],
			required: true,
			index: true,
		},
		/** Клиент для kind === support */
		customer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		status: {
			type: String,
			enum: ['open', 'closed'],
			default: 'open',
		},
		/** Участники для peer (ровно два id, отсортированы по строковому представлению) */
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		/** Уникальная пара userId:userId для peer */
		peerKey: {
			type: String,
			default: null,
		},
		lastMessageAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true },
);

/** Один открытый тикет поддержки на клиента */
conversationSchema.index(
	{ customer: 1 },
	{ unique: true, partialFilterExpression: { kind: 'support', status: 'open' } },
);

conversationSchema.index(
	{ peerKey: 1 },
	{ unique: true, partialFilterExpression: { kind: 'peer', peerKey: { $type: 'string' } } },
);

conversationSchema.index({ kind: 1, status: 1, lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
