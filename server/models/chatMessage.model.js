import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
	{
		conversation: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Conversation',
			required: true,
			index: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		text: {
			type: String,
			trim: true,
			maxlength: 4000,
			default: '',
		},
		attachments: [
			{
				url: { type: String, required: true },
				name: { type: String, default: '' },
				mimeType: { type: String, default: '' },
			},
		],
	},
	{ timestamps: true },
);

chatMessageSchema.index({ conversation: 1, _id: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
