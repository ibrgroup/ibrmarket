'use client';

import { useAuth } from '@/features/auth';
import {
  CHAT_SUPPORT_STATUS_OPEN,
  getPeerConversationSubtitle,
  getStaffMessageLabel,
} from '@/features/chat/lib/chat-labels';
import { ChatComposer } from '@/features/chat/ui/ChatComposer';
import { ChatMessageBubble } from '@/features/chat/ui/ChatMessageBubble';
import {
  chatService,
  type ChatAttachmentDto,
  type ChatMessageDto,
  type ConversationListItem,
} from '@/shared/api/services';
import { uploadChatImageFiles } from '@/shared/lib/upload-chat-images';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Loader2, MessageCircle, Search, Store, UserRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const PEER_ID_RE = /^[a-fA-F0-9]{24}$/;

export function MessagesPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get('with');
  const openOwnerFromQuery = searchParams.get('to') === 'owner';

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachmentDto[]>([]);
  const [listSearch, setListSearch] = useState('');
  const [peerDraft, setPeerDraft] = useState('');
  const [openingPeer, setOpeningPeer] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessageDto[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      const q = new URLSearchParams({ auth: 'required', redirect: '/messages' });
      router.replace(`/?${q.toString()}`);
    }
  }, [isAuthenticated, isInitialized, router]);

  const refreshList = useCallback(async () => {
    try {
      const list = await chatService.listMine();
      setConversations(list);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить диалоги');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshList();
    const t = setInterval(() => void refreshList(), 8000);
    return () => clearInterval(t);
  }, [isAuthenticated, refreshList]);

  const openOwnerChat = async () => {
    try {
      const conv = await chatService.ensureOwnerConversation();
      setSelectedId(conv.id);
      setDraft('');
      setPendingAttachments([]);
      await refreshList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось открыть чат');
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !openOwnerFromQuery) return;
    let cancelled = false;
    (async () => {
      try {
        const conv = await chatService.ensureOwnerConversation();
        if (!cancelled) {
          setSelectedId(conv.id);
          router.replace('/messages');
          await refreshList();
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Не удалось открыть чат');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, openOwnerFromQuery, router, refreshList]);

  const sortedConversations = useMemo(() => {
    const copy = [...conversations];
    copy.sort((a, b) => {
      const aOwner = a.kind === 'support' ? 0 : 1;
      const bOwner = b.kind === 'support' ? 0 : 1;
      if (aOwner !== bOwner) return aOwner - bOwner;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
    return copy;
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return sortedConversations;
    return sortedConversations.filter((c) => {
      if (c.id.toLowerCase().includes(q)) return true;
      if (c.title.toLowerCase().includes(q)) return true;
      if (c.kind === 'peer') {
        return c.peer.id.toLowerCase().includes(q) || c.peer.name.toLowerCase().includes(q);
      }
      return false;
    });
  }, [sortedConversations, listSearch]);

  const openPeer = async () => {
    const id = peerDraft.trim();
    if (!PEER_ID_RE.test(id)) {
      toast.error('Введите корректный ID пользователя (24 символа)');
      return;
    }
    if (id === user?._id) {
      toast.error('Нельзя открыть чат с самим собой');
      return;
    }
    setOpeningPeer(true);
    try {
      const conv = await chatService.ensurePeer(id);
      setSelectedId(conv.id);
      setPeerDraft('');
      await refreshList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось открыть чат');
    } finally {
      setOpeningPeer(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !withUserId || !PEER_ID_RE.test(withUserId)) return;
    if (withUserId === user?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const conv = await chatService.ensurePeer(withUserId);
        if (!cancelled) {
          setSelectedId(conv.id);
          router.replace('/messages');
          await refreshList();
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Не удалось открыть чат');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, withUserId, user?._id, router, refreshList]);

  const loadFullMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await chatService.listMessages(conversationId);
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
    if (!selectedId || !isAuthenticated) return;
    const poll = async () => {
      const list = messagesRef.current;
      const after = list.length ? list[list.length - 1].id : undefined;
      try {
        const chunk = after
          ? await chatService.listMessages(selectedId, after)
          : await chatService.listMessages(selectedId);
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
        /* тихий поллинг */
      }
    };
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [selectedId, isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedId]);

  const selected = useMemo(
    () => sortedConversations.find((c) => c.id === selectedId) ?? null,
    [sortedConversations, selectedId],
  );

  const send = async () => {
    const text = draft.trim();
    if (!selectedId || (!text && pendingAttachments.length === 0)) return;
    setSending(true);
    try {
      const msg = await chatService.sendMessage(selectedId, text, pendingAttachments);
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

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="max-container mx-auto flex min-h-[40vh] items-center justify-center px-4 py-12">
        <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="max-container mx-auto px-4 py-3">
      <div className="mb-4">
        <h1 className="font-roboto text-2xl font-semibold tracking-tight">Сообщения</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Поддержка магазина и переписка с другими пользователями
        </p>
      </div>

      <div className="flex min-h-[480px] flex-col overflow-hidden rounded-3xl bg-card md:flex-row md:min-h-[560px]">
        <aside className="border-border flex w-full flex-col border-b md:w-80 md:border-r md:border-b-0">
          <div className="border-border border-b p-3">
            <button
              type="button"
              onClick={() => void openOwnerChat()}
              className={cn(
                'flex cursor-pointer w-full flex-col gap-1 rounded-2xl border-2 border-primary/25 bg-primary/5 p-3 text-left transition-colors',
                'hover:border-primary/40 hover:bg-primary/10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              )}
            >
              <span className="font-semibold font-roboto text-xl leading-tight">
                Написать в поддержку
              </span>
              <span className="text-muted-foreground text-xs leading-snug">
                Вопросы по заказам, товарам и работе магазина — ответит поддержка
              </span>
            </button>
          </div>
          <div className="border-border space-y-2 border-b p-3">
            <p className="text-muted-foreground text-xs font-medium">Чат по ID пользователя</p>
            <div className="flex gap-2">
              <Input
                placeholder="ID пользователя (24 симв.)"
                value={peerDraft}
                onChange={(e) => setPeerDraft(e.target.value)}
                className="font-mono bg-muted/50 text-xs"
                autoComplete="off"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={openingPeer}
                onClick={() => void openPeer()}
              >
                {openingPeer ? <Loader2 className="size-4 animate-spin" /> : 'Чат'}
              </Button>
            </div>
          </div>
          <div className="border-border border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                placeholder="Поиск по имени или ID…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="bg-muted/50 pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-48 flex-1 md:h-[calc(560px-13rem)]">
            {loadingList ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Загрузка…
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="text-muted-foreground p-4 text-center text-sm">
                {listSearch.trim() ? 'Ничего не найдено' : 'Пока нет диалогов'}
              </p>
            ) : (
              <ul className="p-1">
                {filteredConversations.map((c) => {
                  const active = c.id === selectedId;
                  const subtitle =
                    c.kind === 'support'
                      ? c.status === 'open'
                        ? 'Поддержка'
                        : 'Обращение закрыто'
                      : c.peer.role === 'SELLER'
                        ? 'Селлер'
                        : c.peer.name;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!active) setSelectedId(c.id);
                        }}
                        className={cn(
                          'flex w-full mt-1 items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                          active
                            ? 'bg-primary/10 text-foreground cursor-default'
                            : 'hover:bg-muted/80 cursor-pointer',
                        )}
                      >
                        <div className="bg-muted text-muted-foreground mt-0.5 rounded-lg p-1.5">
                          {c.kind === 'support' ? (
                            <Store className="size-4" />
                          ) : (
                            <UserRound className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{c.title}</div>
                          <div className="text-muted-foreground truncate text-xs">{subtitle}</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </aside>

        <section className="flex min-h-[320px] min-w-0 flex-1 flex-col">
          {!selectedId ? (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageCircle className="size-10 opacity-40" />
              <p className="text-sm">Выберите диалог или создайте новый</p>
            </div>
          ) : (
            <>
              <div className="border-border flex items-center gap-3 border-b px-4 py-3">
                <div className="bg-muted rounded-full p-2">
                  {selected?.kind === 'support' ? (
                    <Store className="size-5" />
                  ) : (
                    <UserRound className="size-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{selected?.title ?? 'Чат'}</div>
                  {selected?.kind === 'support' ? (
                    <div className="text-muted-foreground text-xs">
                      {selected.status === 'open'
                        ? CHAT_SUPPORT_STATUS_OPEN
                        : 'Обращение закрыто — нажмите «Написать в поддержку» выше'}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      {getPeerConversationSubtitle(
                        selected?.kind === 'peer' ? selected.peer.role : undefined,
                      )}
                    </div>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="text-muted-foreground size-8 animate-spin" />
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {messages.map((m) => {
                      const mine = m.senderId === user._id;
                      const label = mine
                        ? 'Вы'
                        : m.isStaff
                          ? getStaffMessageLabel(m.senderRole)
                          : (m.senderName ?? 'Собеседник');
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
                disabled={selected?.kind === 'support' && selected.status === 'closed'}
                placeholder={
                  selected?.kind === 'support' && selected.status === 'closed'
                    ? 'Обращение закрыто — нажмите «Написать в поддержку» выше'
                    : 'Ваше сообщение…'
                }
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
