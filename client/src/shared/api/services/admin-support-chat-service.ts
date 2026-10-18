import { apiClient } from '../client';
import type { ChatMessageDto } from './chat-service';
import { chatService } from './chat-service';

export type AdminSupportTicket = {
  id: string;
  kind: 'support';
  status: 'open' | 'closed';
  lastMessageAt: string;
  updatedAt?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    avatar: string;
  } | null;
};

type ListResponse = { success?: boolean; data?: AdminSupportTicket[] };
type MessagesResponse = { success?: boolean; data?: ChatMessageDto[] };

class AdminSupportChatService {
  async list(status: 'open' | 'closed' | 'all', q?: string): Promise<AdminSupportTicket[]> {
    const params = new URLSearchParams({ status });
    const trimmed = q?.trim();
    if (trimmed) params.set('q', trimmed);
    const res = (await apiClient.get(
      `/api/admin/conversations?${params.toString()}`,
    )) as ListResponse & { data?: AdminSupportTicket[] | { data?: AdminSupportTicket[] } };
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: AdminSupportTicket[] }).data;
    }
    return [];
  }

  async listMessages(conversationId: string, after?: string): Promise<ChatMessageDto[]> {
    const params = new URLSearchParams();
    if (after) params.set('after', after);
    const q = params.toString();
    const url = `/api/admin/conversations/${conversationId}/messages${q ? `?${q}` : ''}`;
    const res = (await apiClient.get(url)) as MessagesResponse & {
      data?: ChatMessageDto[] | { data?: ChatMessageDto[] };
    };
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: ChatMessageDto[] }).data;
    }
    return [];
  }

  async setStatus(conversationId: string, status: 'open' | 'closed'): Promise<void> {
    await apiClient.patch(`/api/admin/conversations/${conversationId}/status`, { status });
  }

  /** Отправка от имени админа — общий эндпоинт диалогов */
  sendMessage(
    conversationId: string,
    text: string,
    attachments?: import('./chat-service').ChatAttachmentDto[],
  ): Promise<ChatMessageDto> {
    return chatService.sendMessage(conversationId, text, attachments);
  }
}

export const adminSupportChatService = new AdminSupportChatService();
