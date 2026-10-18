import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import ChatMessage from '../models/chatMessage.model.js';
import Conversation from '../models/conversation.model.js';
import UserModel from '../models/user.model.js';
import { isStaffRole, isStaffSenderRole } from '../utils/roles.js';

cloudinary.config({
	cloud_name: process.env.cloudinary_Config_Cloud_Name,
	api_key: process.env.cloudinary_Config_api_key,
	api_secret: process.env.cloudinary_Config_api_secret,
	secure: true,
});

function peerKeyFromIds(a, b) {
	const x = a.toString();
	const y = b.toString();
	return x < y ? `${x}:${y}` : `${y}:${x}`;
}

function isAllowedChatAttachmentUrl(url) {
	try {
		const u = new URL(url);
		if (u.protocol !== 'https:') return false;
		return u.hostname === 'res.cloudinary.com' || u.hostname.endsWith('.cloudinary.com');
	} catch {
		return false;
	}
}

const CHAT_IMAGE_MIME_RE = /^image\/(jpeg|png|gif|webp|heic|heif|bmp|svg\+xml)$/i;

async function getUserRole(userId) {
	const u = await UserModel.findById(userId).select('role').lean();
	return u?.role ?? null;
}

export async function canAccessConversation(userId, conv) {
	if (!conv) return false;
	if (conv.kind === 'support') {
		if (conv.customer && conv.customer.toString() === userId.toString()) return true;
		const role = await getUserRole(userId);
		return isStaffRole(role);
	}
	if (conv.kind === 'peer') {
		return conv.participants.some((p) => p.toString() === userId.toString());
	}
	return false;
}

function formatSupportListItem(c) {
	return {
		id: c._id.toString(),
		kind: 'support',
		title: 'Поддержка',
		status: c.status,
		lastMessageAt: c.lastMessageAt,
		updatedAt: c.updatedAt,
	};
}

function formatPeerListItem(c, userId, otherMap) {
	const oid = c.participants.find((p) => p.toString() !== userId.toString());
	const o = oid ? otherMap[oid.toString()] : null;
	return {
		id: c._id.toString(),
		kind: 'peer',
		title: o?.name || 'Пользователь',
		peer: o
			? {
					id: oid.toString(),
					name: o.name,
					avatar: o.avatar || '',
					role: o.role ?? 'USER',
				}
			: { id: oid?.toString() ?? '', name: 'Пользователь', avatar: '', role: 'USER' },
		lastMessageAt: c.lastMessageAt,
		updatedAt: c.updatedAt,
	};
}

export function formatChatMessageDto(m) {
	return {
		id: m._id.toString(),
		text: m.text || '',
		attachments: (m.attachments || []).map((a) => ({
			url: a.url,
			name: a.name || '',
			mimeType: a.mimeType || '',
		})),
		createdAt: m.createdAt,
		senderId: m.sender?._id?.toString(),
		senderName: m.sender?.name,
		senderAvatar: m.sender?.avatar || '',
		senderRole: m.sender?.role ?? null,
		isStaff: isStaffSenderRole(m.sender?.role),
	};
}

/**
 * GET /api/conversations
 */
export async function listMyConversations(req, res) {
	try {
		const userId = req.userId;
		const supportAll = await Conversation.find({ kind: 'support', customer: userId })
			.sort({ lastMessageAt: -1 })
			.lean();
		const support =
			supportAll.length > 0 ? [supportAll.find((c) => c.status === 'open') ?? supportAll[0]] : [];
		const peer = await Conversation.find({
			kind: 'peer',
			participants: new mongoose.Types.ObjectId(userId),
		})
			.sort({ lastMessageAt: -1 })
			.lean();

		const otherIds = peer
			.map((c) => c.participants.find((p) => p.toString() !== userId.toString()))
			.filter(Boolean);
		const others = await UserModel.find({
			_id: { $in: otherIds },
		})
			.select('name avatar role')
			.lean();
		const otherMap = Object.fromEntries(others.map((o) => [o._id.toString(), o]));

		const all = [
			...support.map(formatSupportListItem),
			...peer.map((c) => formatPeerListItem(c, userId, otherMap)),
		].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

		return res.json({ success: true, data: all });
	} catch (e) {
		console.error('listMyConversations', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * GET /api/conversations/:id
 */
export async function getConversation(req, res) {
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
		if (!conv) {
			return res.status(404).json({ success: false, error: true, message: 'Not found' });
		}
		if (!(await canAccessConversation(req.userId, conv))) {
			return res.status(403).json({ success: false, error: true, message: 'Forbidden' });
		}

		if (conv.kind === 'support') {
			return res.json({
				success: true,
				data: formatSupportListItem(conv),
			});
		}

		const oid = conv.participants.find((p) => p.toString() !== req.userId.toString());
		const o = oid ? await UserModel.findById(oid).select('name avatar').lean() : null;
		return res.json({
			success: true,
			data: formatPeerListItem(conv, req.userId, o ? { [oid.toString()]: o } : {}),
		});
	} catch (e) {
		console.error('getConversation', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * POST /api/conversations/support
 */
export async function createOrGetSupport(req, res) {
	try {
		let conv = await Conversation.findOne({
			kind: 'support',
			customer: req.userId,
			status: 'open',
		});
		if (!conv) {
			conv = await Conversation.findOne({
				kind: 'support',
				customer: req.userId,
			}).sort({ lastMessageAt: -1 });
			if (conv) {
				if (conv.status === 'closed') {
					conv.status = 'open';
					conv.lastMessageAt = new Date();
					await conv.save();
				}
			} else {
				conv = await Conversation.create({
					kind: 'support',
					customer: req.userId,
					status: 'open',
					participants: [],
					lastMessageAt: new Date(),
				});
			}
		}
		return res.json({
			success: true,
			data: formatSupportListItem(conv.toObject()),
		});
	} catch (e) {
		console.error('createOrGetSupport', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * POST /api/conversations/peer
 */
export async function createOrGetPeer(req, res) {
	try {
		const { peerUserId } = req.body;
		if (!peerUserId || !mongoose.isValidObjectId(peerUserId)) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Нужен корректный peerUserId',
			});
		}
		if (peerUserId === req.userId) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Нельзя открыть чат с самим собой',
			});
		}
		const peer = await UserModel.findById(peerUserId).select('_id').lean();
		if (!peer) {
			return res.status(404).json({
				success: false,
				error: true,
				message: 'Пользователь не найден',
			});
		}

		const pk = peerKeyFromIds(req.userId, peerUserId);
		let conv = await Conversation.findOne({ kind: 'peer', peerKey: pk });
		if (!conv) {
			const a = new mongoose.Types.ObjectId(req.userId);
			const b = new mongoose.Types.ObjectId(peerUserId);
			const participants = a.toString() < b.toString() ? [a, b] : [b, a];
			conv = await Conversation.create({
				kind: 'peer',
				peerKey: pk,
				participants,
				status: 'open',
				lastMessageAt: new Date(),
			});
		}

		const o = await UserModel.findById(peerUserId).select('name avatar').lean();
		const otherMap = o ? { [peerUserId]: o } : {};
		return res.json({
			success: true,
			data: formatPeerListItem(conv.toObject(), req.userId, otherMap),
		});
	} catch (e) {
		console.error('createOrGetPeer', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * GET /api/conversations/:id/messages
 */
export async function listMessages(req, res) {
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
		if (!conv) {
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
		console.error('listMessages', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * POST /api/conversations/:id/messages
 */
export async function postMessage(req, res) {
	try {
		const { id } = req.params;
		const { text, attachments } = req.body;
		const textTrim = typeof text === 'string' ? text.trim() : '';
		const att = Array.isArray(attachments)
			? attachments
					.filter((a) => a && typeof a.url === 'string' && a.url.trim())
					.filter((a) => isAllowedChatAttachmentUrl(a.url.trim()))
					.slice(0, 5)
					.map((a) => ({
						url: a.url.trim(),
						name: typeof a.name === 'string' ? a.name.slice(0, 200) : '',
						mimeType: typeof a.mimeType === 'string' ? a.mimeType.slice(0, 100) : '',
					}))
			: [];
		if (!textTrim && att.length === 0) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Нужен текст или хотя бы одно вложение',
			});
		}
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Invalid id',
			});
		}
		const conv = await Conversation.findById(id);
		if (!conv) {
			return res.status(404).json({ success: false, error: true, message: 'Not found' });
		}
		if (!(await canAccessConversation(req.userId, conv))) {
			return res.status(403).json({ success: false, error: true, message: 'Forbidden' });
		}

		if (conv.kind === 'support' && conv.status === 'closed') {
			const role = await getUserRole(req.userId);
			if (!isStaffRole(role)) {
				return res.status(400).json({
					success: false,
					error: true,
					message: 'Обращение закрыто. Нажмите «Написать в поддержку», чтобы продолжить диалог.',
				});
			}
			conv.status = 'open';
		}

		if (conv.kind === 'peer' && conv.status === 'closed') {
			conv.status = 'open';
		}

		const msg = await ChatMessage.create({
			conversation: id,
			sender: req.userId,
			text: textTrim,
			attachments: att,
		});
		conv.lastMessageAt = new Date();
		await conv.save();

		const populated = await ChatMessage.findById(msg._id)
			.populate('sender', 'name avatar role')
			.lean();

		return res.status(201).json({
			success: true,
			data: formatChatMessageDto(populated),
		});
	} catch (e) {
		console.error('postMessage', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: 'Internal server error',
		});
	}
}

/**
 * POST /api/conversations/:id/upload-images
 */
export async function uploadChatImages(req, res) {
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
		if (!conv) {
			return res.status(404).json({ success: false, error: true, message: 'Not found' });
		}
		if (!(await canAccessConversation(req.userId, conv))) {
			return res.status(403).json({ success: false, error: true, message: 'Forbidden' });
		}
		if (conv.kind === 'support' && conv.status === 'closed') {
			const role = await getUserRole(req.userId);
			if (!isStaffRole(role)) {
				return res.status(400).json({
					success: false,
					error: true,
					message: 'Обращение закрыто. Нажмите «Написать в поддержку», чтобы продолжить диалог.',
				});
			}
		}

		const files = req.files;
		if (!files || !Array.isArray(files) || files.length === 0) {
			return res.status(400).json({
				success: false,
				error: true,
				message: 'Нет файлов для загрузки',
			});
		}

		const uploadOptions = {
			use_filename: true,
			unique_filename: true,
			overwrite: false,
			folder: 'chat',
		};
		const uploadedImages = [];

		for (const file of files) {
			if (!CHAT_IMAGE_MIME_RE.test(file.mimetype || '')) {
				for (const f of files) {
					if (f.path) fs.unlink(f.path, () => {});
				}
				return res.status(400).json({
					success: false,
					error: true,
					message: 'Допустимы только файлы изображений',
				});
			}
			try {
				const uploadResult = await cloudinary.uploader.upload(file.path, uploadOptions);
				uploadedImages.push({
					url: uploadResult.secure_url,
					name: file.originalname || '',
					mimeType: file.mimetype || '',
				});
			} finally {
				fs.unlink(file.path, () => {});
			}
		}

		return res.status(200).json({
			success: true,
			attachments: uploadedImages,
		});
	} catch (e) {
		console.error('uploadChatImages', e);
		return res.status(500).json({
			success: false,
			error: true,
			message: e.message || 'Internal server error',
		});
	}
}
