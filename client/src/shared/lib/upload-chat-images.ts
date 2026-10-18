import { apiClient } from '@/shared/api/client';
import type { ChatAttachmentDto } from '@/shared/api/services/chat-service';

/** Лимит размера одного фото в чате (байт). */
export const CHAT_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

/**
 * Загрузка фото в диалог (multipart → Cloudinary). Участник диалога.
 */
export async function uploadChatImageFiles(
  conversationId: string,
  files: File[],
): Promise<ChatAttachmentDto[]> {
  if (!files.length) return [];
  for (const f of files) {
    if (f.size > CHAT_IMAGE_MAX_BYTES) {
      throw new Error(
        `Файл «${f.name}» слишком большой (макс. ${Math.round(CHAT_IMAGE_MAX_BYTES / (1024 * 1024))} МБ).`,
      );
    }
    if (!f.type.startsWith('image/')) {
      throw new Error(`«${f.name}» — нужен файл изображения.`);
    }
  }
  const fd = new FormData();
  for (const f of files) {
    fd.append('images', f);
  }
  const res = await apiClient.post<{
    attachments?: ChatAttachmentDto[];
    success?: boolean;
    message?: string;
  }>(`/api/conversations/${conversationId}/upload-images`, fd);
  const raw = res as { attachments?: ChatAttachmentDto[]; success?: boolean; message?: string };
  if (raw.success === false) {
    throw new Error(raw.message || 'Ошибка загрузки изображений');
  }
  const attachments = raw.attachments;
  if (!Array.isArray(attachments) || attachments.length === 0) {
    throw new Error('Сервер не вернул вложения');
  }
  return attachments;
}
