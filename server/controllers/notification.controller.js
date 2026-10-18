import NotificationModel from '../models/notification.model.js';

export const listNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const onlyUnread = req.query.onlyUnread === 'true';
    const types = req.query.types ? String(req.query.types).split(',') : undefined;
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const skip = (page - 1) * limit;

    const query = { userId };
    if (onlyUnread) query.read = false;
    if (types && types.length) query.type = { $in: types };

    const [items, total, unread] = await Promise.all([
      NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments({ userId, read: false }),
    ]);

    return res.json({ items, page, limit, total, unread });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list notifications', error: String(e) });
  }
};

export const createNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, message, type, actionUrl, data } = req.body || {};
    if (!title || !message || !type) {
      return res.status(400).json({ message: 'title, message and type are required' });
    }

    const created = await NotificationModel.create({
      userId,
      title,
      message,
      type,
      actionUrl,
      data,
    });
    return res.status(201).json(created);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to create notification', error: String(e) });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await NotificationModel.updateOne({ _id: id, userId }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to mark as read', error: String(e) });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to mark all as read', error: String(e) });
  }
};

export const removeNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await NotificationModel.deleteOne({ _id: id, userId });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to remove notification', error: String(e) });
  }
};

export const clearAll = async (req, res) => {
  try {
    const userId = req.userId;
    await NotificationModel.deleteMany({ userId });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to clear notifications', error: String(e) });
  }
};
