'use client';

import type { ChatMessageDto } from '@/shared/api/services/chat-service';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import Image from 'next/image';

type ChatMessageBubbleProps = {
  message: ChatMessageDto;
  mine: boolean;
  label: string;
};

export function ChatMessageBubble({ message, mine, label }: ChatMessageBubbleProps) {
  const attachments = message.attachments ?? [];
  const hasText = Boolean(message.text?.trim());

  return (
    <li className={cn('flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={message.senderAvatar} alt="" />
        <AvatarFallback className="text-xs">{label.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md',
        )}
      >
        <div className="text-[10px] font-medium opacity-80">{label}</div>
        {hasText ? <p className="mt-0.5 whitespace-pre-wrap break-words">{message.text}</p> : null}
        {attachments.length > 0 ? (
          <div className={cn('flex flex-wrap gap-2', hasText ? 'mt-2' : 'mt-0.5')}>
            {attachments.map((a, i) => (
              <a
                key={`${a.url}-${i}`}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'block overflow-hidden rounded-lg border',
                  mine ? 'border-primary-foreground/25' : 'border-border/40',
                )}
              >
                <Image
                  src={a.url}
                  alt={a.name || 'Вложение'}
                  width={160}
                  height={160}
                  className="size-32 object-cover"
                  unoptimized
                />
              </a>
            ))}
          </div>
        ) : null}
        <div className={cn('mt-1 text-[10px] opacity-70', mine ? 'text-right' : 'text-left')}>
          {new Date(message.createdAt).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </li>
  );
}
