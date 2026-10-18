'use client';

import { useAuth } from '@/features/auth';
import { getStaffMessageLabel } from '@/features/chat/lib/chat-labels';
import { ChatComposer } from '@/features/chat/ui/ChatComposer';
import { ChatMessageBubble } from '@/features/chat/ui/ChatMessageBubble';
import {
  adminSupportChatService,
  type AdminSupportTicket,
  type ChatAttachmentDto,
  type ChatMessageDto,
} from '@/shared/api/services';
import { uploadChatImageFiles } from '@/shared/lib/upload-chat-images';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';
import { Loader2, Search, Store } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export function AdminSupportChatPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQ, setSearchQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachmentDto[]>([]);
  const [patching, setPatching] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessageDto[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const refreshList = useCallback(async () => {
    try {
      const list = await adminSupportChatService.list(statusFilter, debouncedQ || undefined);
      setTickets(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить обращения');
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, debouncedQ]);

  useEffect(() => {
    setLoadingList(true);
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const t = setInterval(() => void refreshList(), 12000);
    return () => clearInterval(t);
  }, [refreshList]);

  const selected = (Array.isArray(tickets) ? tickets : []).find((t) => t.id === selectedId) ?? null;

  const loadFullMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await adminSupportChatService.listMessages(conversationId);
      setMessages(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить сообщения');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setPendingAttachments([]);
      return;
    }
    setPendingAttachments([]);
    void loadFullMessages(selectedId);
  }, [selectedId, loadFullMessages]);

  useEffect(() => {
    if (!selectedId) return;
    const poll = async () => {
      const list = messagesRef.current;
      const after = list.length ? list[list.length - 1].id : undefined;
      try {
        const chunk = after
          ? await adminSupportChatService.listMessages(selectedId, after)
          : await adminSupportChatService.listMessages(selectedId);
        if (chunk.length === 0) return;
        if (after) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const next = chunk.filter((c) => !ids.has(c.id));
            return next.length ? [...prev, ...next] : prev;
          });
        } else if (!after && list.length === 0) {
          setMessages(chunk);
        }
      } catch {
        /* поллинг */
      }
    };
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedId]);

  const send = async () => {
    const text = draft.trim();
    if (!selectedId || (!text && pendingAttachments.length === 0)) return;
    setSending(true);
    try {
      const msg = await adminSupportChatService.sendMessage(selectedId, text, pendingAttachments);
      setDraft('');
      setPendingAttachments([]);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      void refreshList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не отправилось');
    } finally {
      setSending(false);
    }
  };

  const pickImages = async (files: FileList | null) => {
    if (!selectedId || !files?.length) return;
    const slotsLeft = Math.max(0, 5 - pendingAttachments.length);
    if (slotsLeft === 0) {
      toast.error('Не больше 5 фото за одно сообщение');
      return;
    }
    setUploadingImages(true);
    try {
      const uploaded = await uploadChatImageFiles(
        selectedId,
        Array.from(files).slice(0, slotsLeft),
      );
      setPendingAttachments((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить фото');
    } finally {
      setUploadingImages(false);
    }
  };

  const toggleStatus = async () => {
    if (!selected) return;
    const next = selected.status === 'open' ? 'closed' : 'open';
    setPatching(true);
    try {
      await adminSupportChatService.setStatus(selected.id, next);
      toast.success(next === 'closed' ? 'Обращение закрыто' : 'Обращение снова открыто');
      await refreshList();
      setSelectedId(selected.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось обновить статус');
    } finally {
      setPatching(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Сообщения от покупателей"
        description="Пользователи пишут вам из раздела «Сообщения» в закреплённом чате «Поддержка». Здесь собраны все обращения."
      />

      <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl bg-card lg:flex-row">
        <aside className="border-border flex w-full flex-col border-b lg:w-96 lg:border-r lg:border-b-0">
          <div className="border-border flex flex-col gap-2 border-b p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">Фильтр</span>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as typeof statusFilter);
                  setSelectedId(null);
                }}
              >
                <SelectTrigger className="h-9 bg-gray-100 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-gray-100'>
                  <SelectItem value="open">Открытые</SelectItem>
                  <SelectItem value="closed">Закрытые</SelectItem>
                  <SelectItem value="all">Все</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="ID, имя, email, телефон, заказ…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="bg-gray-100 h-9 pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-64 flex-1 lg:h-[480px]">
            {loadingList ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Загрузка…
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-muted-foreground p-4 text-center text-sm">
                {debouncedQ ? 'Ничего не найдено' : 'Нет обращений'}
              </p>
            ) : (
              <ul className="p-1">
                {tickets.map((t) => {
                  const active = t.id === selectedId;
                  const name = t.customer?.name ?? 'Неизвестно';
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                          'flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                          active ? 'bg-primary/10' : 'hover:bg-muted/80',
                        )}
                      >
                        <div className="bg-muted rounded-lg p-1.5">
                          <Store className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{name}</span>
                            <Badge variant={t.status === 'open' ? 'default' : 'secondary'}>
                              {t.status === 'open' ? 'Открыто' : 'Закрыто'}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {t.customer?.email || t.customer?.mobile || t.customer?.id}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </aside>

        <section className="flex min-h-[360px] min-w-0 flex-1 flex-col">
          {!selectedId || !selected ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
              Выберите обращение слева
            </div>
          ) : (
            <>
              <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10 border">
                    <AvatarImage src={selected.customer?.avatar} alt="" />
                    <AvatarFallback>{(selected.customer?.name ?? '?').slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {selected.customer?.name ?? 'Клиент'}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {[selected.customer?.email, selected.customer?.mobile]
                        .filter(Boolean)
                        .join(' · ') || selected.customer?.id}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={patching}
                  onClick={() => void toggleStatus()}
                >
                  {patching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : selected.status === 'open' ? (
                    'Закрыть обращение'
                  ) : (
                    'Открыть снова'
                  )}
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="text-muted-foreground size-8 animate-spin" />
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {messages.map((m) => {
                      const mine = m.senderId === user?._id;
                      const label = mine
                        ? 'Вы'
                        : m.isStaff
                          ? getStaffMessageLabel(m.senderRole)
                          : (m.senderName ?? 'Покупатель');
                      return <ChatMessageBubble key={m.id} message={m} mine={mine} label={label} />;
                    })}
                    <div ref={bottomRef} />
                  </ul>
                )}
              </ScrollArea>

              <ChatComposer
                draft={draft}
                onDraftChange={setDraft}
                pendingAttachments={pendingAttachments}
                onRemoveAttachment={(i) =>
                  setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
                }
                onPickImages={(files) => void pickImages(files)}
                onSend={() => void send()}
                sending={sending}
                uploading={uploadingImages}
                placeholder={
                  selected.status === 'closed'
                    ? 'Ответ переоткроет обращение…'
                    : 'Ответ покупателю…'
                }
              />
              {selected.status === 'closed' ? (
                <p className="text-muted-foreground px-3 pb-3 text-center text-xs">
                  Обращение закрыто. Ответ клиенту автоматически откроет его снова.
                </p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
