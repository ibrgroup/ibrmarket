'use client';

import type { ChatAttachmentDto } from '@/shared/api/services/chat-service';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ImagePlus, Loader2, SendHorizontal, X } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';

type ChatComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  pendingAttachments: ChatAttachmentDto[];
  onRemoveAttachment: (index: number) => void;
  onPickImages: (files: FileList | null) => void;
  onSend: () => void;
  sending: boolean;
  uploading: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatComposer({
  draft,
  onDraftChange,
  pendingAttachments,
  onRemoveAttachment,
  onPickImages,
  onSend,
  sending,
  uploading,
  disabled,
  placeholder = 'Ваше сообщение…',
}: ChatComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend =
    !disabled &&
    !sending &&
    !uploading &&
    (draft.trim().length > 0 || pendingAttachments.length > 0);
  const atAttachmentLimit = pendingAttachments.length >= 5;

  return (
    <div className="border-border border-t">
      {pendingAttachments.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {pendingAttachments.map((a, i) => (
            <div key={`${a.url}-${i}`} className="relative">
              <Image
                src={a.url}
                alt={a.name || 'Вложение'}
                width={64}
                height={64}
                className="size-16 rounded-lg object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => onRemoveAttachment(i)}
                className="bg-background/90 absolute -top-1.5 -right-1.5 rounded-full border p-0.5 shadow-sm"
                aria-label="Убрать фото"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2 p-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onPickImages(e.target.files);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || uploading || atAttachmentLimit}
          onClick={() => fileRef.current?.click()}
          aria-label="Прикрепить фото"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
        </Button>
        <Input
          placeholder={placeholder}
          value={draft}
          disabled={disabled}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          className={cn('bg-muted/50')}
        />
        <Button
          type="button"
          size="icon"
          disabled={!canSend}
          onClick={onSend}
          aria-label="Отправить"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
