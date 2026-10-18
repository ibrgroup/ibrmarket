/** Заголовок единственного чата поддержки в списке диалогов */
export const CHAT_SUPPORT_TITLE = 'Поддержка';

export const CHAT_SUPPORT_STATUS_OPEN = 'Служба поддержки ответит здесь';

/** Подпись сообщения от сотрудника магазина */
export function getStaffMessageLabel(senderRole?: string | null): string {
  if (String(senderRole || '').toUpperCase() === 'SELLER') return 'Селлер';
  return CHAT_SUPPORT_TITLE;
}

/** Подзаголовок peer-диалога */
export function getPeerConversationSubtitle(peerRole?: string | null): string {
  if (String(peerRole || '').toUpperCase() === 'SELLER') return 'Селлер';
  return 'Переписка с пользователем';
}
