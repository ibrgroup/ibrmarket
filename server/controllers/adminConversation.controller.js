import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';
import { canAccessConversation, formatChatMessageDto } from './conversation.controller.js';
import ChatMessage from '../models/chatMessage.model.js';
import OrderModel from '../models/order.model.js';

/**
 * GET /api/admin/conversations
 * query: status = open | closed | all
 */
export async function listAdminSupportConversations(req, res) {
	try {
		const raw = String(req.query.status || 'open');
		const q = { kind: 'support' };
		if (raw === 'open' || raw === 'closed') {
			q.status = raw;
		}

		const rows = await Conversation.find(q)
			.sort({ lastMessageAt: -1 })
			.populate('customer', 'name email mobile avatar')
			.lean();

		const supportConvIds = rows.map((c) => c._id);

		let data = rows.map((c) => ({
			id: c._id.toString(),
			kind: 'support',
			status: c.status,
			lastMessageAt: c.lastMessageAt,
			updatedAt: c.updatedAt,
			customer: c.customer
				? {
						id: c.customer._id.toString(),
						name: c.customer.name,
						email: c.customer.email || '',
						mobile: c.customer.mobile || '',
						avatar: c.customer.avatar || '',
					}
				: null,
		}));

		const searchQ = String(req.query.q || '')
			.trim()
			.toLowerCase();
		if (searchQ) {
			const customerIdsFromOrders = new Set();
			if (mongoose.isValidObjectId(searchQ)) {
				const order = await OrderModel.findById(searchQ).select('userId').lean();
				if (order?.userId) {
					customerIdsFromOrders.add(order.userId.toString());
				}
			}
			const escaped = searchQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const convIdsFromMessages =
				supportConvIds.length > 0
					? await ChatMessage.find({
							conversation: { $in: supportConvIds },
							text: { $regex: escaped, $options: 'i' },
						})
							.distinct('conversation')
							.lean()
					: [];

			const msgConvSet = new Set(convIdsFromMessages.map((id) => id.toString()));

			data = data.filter((t) => {
				if (t.id.toLowerCase().includes(searchQ)) return true;
				if (msgConvSet.has(t.id)) return true;
				const c = t.customer;
				if (!c) return false;
				if (customerIdsFromOrders.has(c.id)) return true;
				if (mongoose.isValidObjectId(searchQ) && c.id === searchQ) return true;
				return [c.id, c.name, c.email, c.mobile].some(
					(f) => f && f.toLowerCase().includes(searchQ),
				);
			});
		}

		return res.json({ success: true, data });
	} catch (e) {
		console.error('listAdminSupportConversations', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * GET /api/admin/conversations/:id/messages — то же правило доступа, что и у пользователя (admin)
 */
export async function listAdminMessages(req, res) {
	try {
		const { id } = req.params;
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Invalid id',
			});
		}
		const conv = await Conversation.findById(id).lean();
		if (!conv || conv.kind !== 'support') {
			return res.status(404).json({ success: false, error: true, message: 'Not found' });
		}
		if (!(await canAccessConversation(req.userId, conv))) {
			return res.status(403).json({ success: false, error: true, message: 'Forbidden' });
		}

		const after = req.query.after;
		const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 100);

		if (after && mongoose.isValidObjectId(after)) {
			const msgs = await ChatMessage.find({
				conversation: id,
				_id: { $gt: after },
			})
				.sort({ _id: 1 })
				.limit(limit)
				.populate('sender', 'name avatar role')
				.lean();
			const data = msgs.map((m) => formatChatMessageDto(m));
			return res.json({ success: true, data });
		}

		const msgs = await ChatMessage.find({ conversation: id })
			.sort({ _id: -1 })
			.limit(limit)
			.populate('sender', 'name avatar role')
			.lean();
		msgs.reverse();
		const data = msgs.map((m) => formatChatMessageDto(m));
		return res.json({ success: true, data });
	} catch (e) {
		console.error('listAdminMessages', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * PATCH /api/admin/conversations/:id/status
 */
export async function patchSupportConversationStatus(req, res) {
	try {
		const { id } = req.params;
		const { status } = req.body;
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Invalid id',
			});
		}
		if (status !== 'open' && status !== 'closed') {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'status должен быть open или closed',
			});
		}

		const conv = await Conversation.findById(id);
		if (!conv || conv.kind !== 'support') {
			return res.status(404).json({ success: false, error: true, message: 'Not found' });
		}

		conv.status = status;
		await conv.save();

		return res.json({
			success: true,
			data: {
				id: conv._id.toString(),
				status: conv.status,
			},
		});
	} catch (e) {
		console.error('patchSupportConversationStatus', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}
