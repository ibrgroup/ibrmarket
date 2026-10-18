import { apiClient } from '../client';

export type SupportConversationItem = {
  id: string;
  kind: 'support';
  title: string;
  status: 'open' | 'closed';
  lastMessageAt: string;
  updatedAt?: string;
};

export type PeerConversationItem = {
  id: string;
  kind: 'peer';
  title: string;
  peer: { id: string; name: string; avatar: string; role?: string };
  lastMessageAt: string;
  updatedAt?: string;
};

export type ConversationListItem = SupportConversationItem | PeerConversationItem;

export type ChatAttachmentDto = {
  url: string;
  name?: string;
  mimeType?: string;
};

export interface ChatMessageDto {
  id: string;
  text: string;
  attachments?: ChatAttachmentDto[];
  createdAt: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string | null;
  isStaff: boolean;
}

type ListConvResponse = { success?: boolean; data?: ConversationListItem[] };
type OneConvResponse = { success?: boolean; data?: ConversationListItem };
type MessagesResponse = { success?: boolean; data?: ChatMessageDto[] };
type SendResponse = { success?: boolean; data?: ChatMessageDto };

class ChatService {
  async listMine(): Promise<ConversationListItem[]> {
    const res = (await apiClient.get(`/api/conversations`)) as ListConvResponse;
    return res.data ?? [];
  }

  async ensureSupport(): Promise<ConversationListItem> {
    const res = (await apiClient.post(`/api/conversations/support`)) as OneConvResponse;
    if (!res.data) throw new Error('Пустой ответ сервера');
    return res.data;
  }

  /** Один канал на покупателя: переписка с владельцем магазина (те же данные, что ensureSupport). */
  async ensureOwnerConversation(): Promise<ConversationListItem> {
    return this.ensureSupport();
  }

  async ensurePeer(peerUserId: string): Promise<ConversationListItem> {
    const res = (await apiClient.post(`/api/conversations/peer`, {
      peerUserId,
    })) as OneConvResponse;
    if (!res.data) throw new Error('Пустой ответ сервера');
    return res.data;
  }

  async listMessages(conversationId: string, after?: string): Promise<ChatMessageDto[]> {
    const params = new URLSearchParams();
    if (after) params.set('after', after);
    const q = params.toString();
    const url = `/api/conversations/${conversationId}/messages${q ? `?${q}` : ''}`;
    const res = (await apiClient.get(url)) as MessagesResponse;
    return res.data ?? [];
  }

  async sendMessage(
    conversationId: string,
    text: string,
    attachments?: ChatAttachmentDto[],
  ): Promise<ChatMessageDto> {
    const res = (await apiClient.post(`/api/conversations/${conversationId}/messages`, {
      text,
      attachments: attachments ?? [],
    })) as SendResponse;
    if (!res.data) throw new Error('Пустой ответ сервера');
    return res.data;
  }
}

export const chatService = new ChatService();
