'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertCircle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiGift,
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiX,
} from 'react-icons/fi';
import { useNotificationStore } from '../model/notification.store';
import type { NotificationItemProps, NotificationListProps } from '../model/types';

import './notification-animations.css';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order':
      return <FiPackage className="h-5 w-5" />;
    case 'product':
      return <FiShoppingCart className="h-5 w-5" />;
    case 'payment':
      return <FiCreditCard className="h-5 w-5" />;
    case 'delivery':
      return <FiTruck className="h-5 w-5" />;
    case 'promotional':
      return <FiGift className="h-5 w-5" />;
    case 'security':
      return <FiAlertCircle className="h-5 w-5" />;
    default:
      return <FiBell className="h-5 w-5" />;
  }
};

const NotificationItemAnimated: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClear,
}) => {
  const router = useRouter();
  const { id, title, message, type, read, createdAt, actionUrl } = notification;
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fix: only stopPropagation if onMarkAsRead button is clicked, not on main body click
  const handleClick = async () => {
    if (actionUrl) {
      // Проверяем, является ли URL внутренним или внешним
      if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
        // Внешний URL - используем window.location.href
        window.location.href = actionUrl;
      } else {
        // Внутренний URL - используем router
        router.push(actionUrl);
      }
    }
    if (!read && !isLoading) {
      setIsLoading(true);
      try {
        await onMarkAsRead?.(id);
      } finally {
        setIsLoading(false);
      }
    }
    try {
      const storeState = useNotificationStore.getState();
      const { trackEvent } = storeState;
      trackEvent && trackEvent('notification_click', { id, type });
    } catch {
      /* empty */
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!read && !isLoading) {
      setIsLoading(true);
      try {
        await onMarkAsRead?.(id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setIsRemoving(true);
    setTimeout(() => {
      onClear?.(id);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div
      role="listitem"
      aria-live={!read ? 'polite' : undefined}
      className={`xs:p-3 overflow-hidden rounded-lg border p-2 transition-all duration-300 ease-in-out sm:p-4 ${
        read
          ? 'bg-background border-border hover:bg-muted/50'
          : 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30 hover:bg-primary/10 dark:hover:bg-primary/20 notif-unread-highlight'
      } ${!read ? 'animate-pulse-slow' : ''} ${
        isRemoving ? 'animate-notification-remove' : 'animate-notification-expand'
      } notif-type-${type}`}
      style={{ animationFillMode: 'both' }}
    >
      <div className="xs:flex-row xs:items-start xs:gap-3 flex flex-col gap-2 sm:gap-4">
        <div className={`flex-shrink-0 ${read ? 'text-muted-foreground' : 'text-primary'}`}>
          {getNotificationIcon(type)}
        </div>
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={handleClick}
          role="button"
          aria-pressed={read}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <div className="xs:flex-row xs:items-start xs:justify-between xs:gap-2 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1">
              <h4
                className={`xs:text-base truncate text-sm font-semibold ${
                  read ? 'text-foreground' : 'text-foreground font-bold'
                }`}
              >
                {title}
              </h4>
              <span className={`flex-shrink-0 ${read ? 'text-green-500' : 'text-blue-500'}`}>
                {read ? (
                  <FiCheckCircle className="inline h-3 w-3" title="Прочитано" />
                ) : (
                  <FiBell className="inline h-3 w-3" title="Непрочитано" />
                )}
              </span>
            </div>
            <time
              className="text-muted-foreground xs:self-auto flex-shrink-0 self-start text-xs whitespace-nowrap"
              aria-label={`Время: ${format(new Date(createdAt), 'HH:mm', { locale: ru })}`}
            >
              {format(new Date(createdAt), 'HH:mm', { locale: ru })}
            </time>
          </div>
          <p
            className={`xs:text-sm mt-1 text-xs ${
              read ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {message}
          </p>
        </div>
        <div className="xs:self-auto xs:mt-0.5 mt-1 flex flex-shrink-0 items-center justify-end gap-1 self-start">
          {!read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="hover:bg-primary/20 dark:hover:bg-primary/30 h-7 rounded-md px-2 py-1 text-xs transition-colors duration-200"
              disabled={isLoading}
              aria-label="Пометить как прочитанное"
            >
              {isLoading ? (
                <>
                  <FiCheckCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
                  <span className="xs:inline hidden">Загрузка...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="mr-1 h-3.5 w-3.5" />
                  <span className="xs:inline hidden">Прочитано</span>
                  <span className="xs:hidden">✓</span>
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 h-7 w-7 rounded-full p-0 transition-colors duration-200"
            disabled={isLoading}
            aria-label="Удалить уведомление"
          >
            {isLoading ? (
              <FiCheckCircle className="h-4 w-4 animate-spin" />
            ) : (
              <FiX className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const groupNotificationsByType = (notifications: Notification[]) => {
  const grouped: Record<string, Notification[]> = {};
  for (const notification of notifications) {
    if (!grouped[notification.type]) {
      grouped[notification.type] = [];
    }
    grouped[notification.type].push(notification);
  }
  return grouped;
};

type Notification = import('../model/types').Notification;

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
  onClearAll,
  maxNotifications = 10,
  className = '',
}) => {
  const {
    preferences: {
      showOnlyUnread,
      groupByType,
      maxPerGroup,
      hiddenCategories,
      enableVirtualization,
    },
  } = useNotificationStore();

  const filtered = useMemo(
    () =>
      notifications
        .filter((n) => (showOnlyUnread ? !n.read : true))
        .filter((n) => !hiddenCategories.includes(n.type)),
    [notifications, showOnlyUnread, hiddenCategories],
  );

  const unreadCount = filtered.filter((n) => !n.read).length;
  const [isMarkAllLoading, setIsMarkAllLoading] = useState(false);
  const [isClearAllLoading, setIsClearAllLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const baseList = filtered.slice(0, maxNotifications);
  const groupedNotifications = groupByType ? groupNotificationsByType(baseList) : { all: baseList };
  const groupedEntries = Object.entries(groupedNotifications);

  // Fix: React.useEffect was missing a stable dependency array; we use JSON.stringify here to track actual groupedEntries changes
  const groupedEntriesDeps = JSON.stringify(
    groupedEntries.map(([g, items]) => ({ g, items: items.map((n) => n.id + n.read) })),
  );
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    let opened = 0;
    for (const [g, items] of groupedEntries) {
      if (opened < 2 && items.some((n) => !n.read)) {
        initial[g] = true;
        opened++;
      } else {
        initial[g] = false;
      }
    }
    setExpandedGroups((prev) => ({ ...initial, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedEntriesDeps]);

  const toggleGroup = (groupType: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupType]: !prev[groupType],
    }));
  };

  return (
    <Card
      className={`xs:max-w-xs w-full max-w-[95vw] sm:max-w-sm ${className} rounded-xl border shadow-lg transition-all duration-300 ease-in-out`}
    >
      <CardHeader className="">
        <div className="xs:flex-row xs:items-center xs:justify-between xs:gap-0 flex flex-col gap-2">
          <CardTitle className="xs:text-lg text-foreground flex items-center gap-2 text-base font-semibold">
            <FiBell className="xs:w-5 xs:h-5 text-primary h-4 w-4" />
            Уведомления
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="xs:ml-2 xs:h-6 xs:px-2 xs:text-xs animate-pop-in ml-1 h-5 px-1.5 text-[0.6rem] font-medium"
              >
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1" role="toolbar" aria-label="Действия со списком уведомлений">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsMarkAllLoading(true);
                  try {
                    await onMarkAllAsRead?.();
                  } finally {
                    setIsMarkAllLoading(false);
                  }
                }}
                className="xs:h-8 xs:text-xs xs:px-2 xs:py-1 hover:bg-primary/20 dark:hover:bg-primary/30 h-7 rounded-md px-1.5 py-0.5 text-[0.6rem] transition-colors duration-200"
                disabled={isMarkAllLoading}
              >
                {isMarkAllLoading ? (
                  <>
                    <FiCheck className="xs:w-3.5 xs:h-3.5 mr-1 h-3 w-3 animate-spin" />
                    <span className="xs:inline hidden">Загрузка...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="xs:w-3.5 xs:h-3.5 mr-1 h-3 w-3" />
                    <span className="xs:inline hidden">Все прочитано</span>
                    <span className="xs:hidden">✓</span>
                  </>
                )}
              </Button>
            )}
            {notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="xs:h-8 xs:text-xs xs:px-2 xs:py-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 h-7 rounded-md px-1.5 py-0.5 text-[0.6rem] transition-colors duration-200"
                    disabled={isClearAllLoading}
                  >
                    {isClearAllLoading ? (
                      <>
                        <FiCheckCircle className="xs:w-3.5 xs:h-3.5 mr-1 h-3 w-3 animate-spin" />
                        <span className="xs:inline hidden">Загрузка...</span>
                        <span className="xs:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <FiX className="xs:w-3.5 xs:h-3.5 mr-1 h-3 w-3" />
                        <span className="xs:inline hidden">Очистить все</span>
                        <span className="xs:hidden">✕</span>
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] rounded-xl border shadow-2xl transition-all duration-300 ease-in-out sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">
                      Очистить все уведомления?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Вы уверены, что хотите удалить все уведомления? Это действие нельзя отменить.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="transition-colors duration-20">
                      Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async (e) => {
                        e.stopPropagation();
                        setIsClearAllLoading(true);
                        try {
                          await onClearAll?.();
                        } finally {
                          setIsClearAllLoading(false);
                        }
                      }}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md transition-colors duration-200"
                      disabled={isClearAllLoading}
                    >
                      {isClearAllLoading ? (
                        <>
                          <FiCheckCircle className="xs:w-4 xs:h-4 xs:mr-2 mr-1 h-3.5 w-3.5 animate-spin" />
                          Удаление...
                        </>
                      ) : (
                        'Удалить все'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <Separator className="my-0" />
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="xs:py-10 xs:px-6 xs:min-h-[200px] flex min-h-[180px] flex-col items-center justify-center px-4 py-8 text-center">
            <FiBell className="xs:w-10 text-muted-foreground xs:mb-3 mb-2 h-8 h-10 w-8" />
            <p className="text-foreground xs:text-base text-sm font-medium">Нет уведомлений</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Здесь будут отображаться ваши уведомления
            </p>
          </div>
        ) : (
          <ScrollArea className="h-auto max-h-[400px] px-1 sm:px-2">
            <div className="space-y-2 p-2 sm:space-y-3 sm:p-3">
              {groupedEntries.map(([groupType, groupNotifications]) => {
                const isGroupExpanded = expandedGroups[groupType] ?? true;
                const unreadCountInGroup = groupNotifications.filter((n) => !n.read).length;
                const showVirtualized =
                  enableVirtualization && groupNotifications.length > maxPerGroup;
                return (
                  <div key={groupType} className="overflow-hidden rounded-lg border">
                    <div
                      className="xs:flex-row xs:items-center xs:p-3 bg-muted/30 hover:bg-muted/50 flex cursor-pointer flex-col justify-between gap-2 p-2 transition-colors"
                      onClick={() => toggleGroup(groupType)}
                    >
                      <div className="xs:flex-nowrap flex flex-wrap items-center gap-2">
                        {getNotificationIcon(groupType)}
                        <span
                          className="xs:text-base text-sm font-medium capitalize"
                          aria-label={`Группа ${groupType}`}
                        >
                          {groupByType ? groupType : 'Все'}
                        </span>
                        {unreadCountInGroup > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 flex-shrink-0 px-1.5 text-xs"
                          >
                            {unreadCountInGroup}
                          </Badge>
                        )}
                      </div>
                      <div className="xs:w-auto xs:justify-end flex w-full items-center justify-between gap-2">
                        <span className="text-muted-foreground xs:text-left text-right text-xs">
                          {groupNotifications.length}{' '}
                          {groupNotifications.length === 1
                            ? 'уведомление'
                            : groupNotifications.length < 5
                              ? 'уведомления'
                              : 'уведомлений'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground h-6 w-6 flex-shrink-0 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(groupType);
                          }}
                        >
                          {isGroupExpanded ? (
                            <FiX className="h-4 w-4" />
                          ) : (
                            <FiCheck className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {isGroupExpanded && (
                      <div
                        className="xs:p-3 bg-background space-y-2 border-t p-2"
                        role="list"
                        aria-label={`Список уведомлений группы ${groupType}`}
                      >
                        {showVirtualized ? (
                          <VirtualizedGroup
                            items={groupNotifications}
                            onMarkAsRead={onMarkAsRead}
                            onClear={onClear}
                          />
                        ) : (
                          groupNotifications.map((notification) => (
                            <NotificationItemAnimated
                              key={notification.id}
                              notification={notification}
                              onMarkAsRead={onMarkAsRead}
                              onClear={onClear}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

const VirtualizedGroup: React.FC<{
  items: Notification[];
  onMarkAsRead?: (id: string) => void;
  onClear?: (id: string) => void;
}> = React.memo(({ items, onMarkAsRead, onClear }) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: useCallback(() => parentRef.current, [parentRef]),
    estimateSize: useCallback(() => 76, []),
    overscan: 6,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} style={{ maxHeight: 320, overflowY: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualItems.map((item: ReturnType<typeof virtualizer.getVirtualItems>[number]) => {
          const n = items[item.index];
          return (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${item.start}px)`,
              }}
            >
              <NotificationItemAnimated
                notification={n}
                onMarkAsRead={onMarkAsRead}
                onClear={onClear}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

export { NotificationItemAnimated as NotificationItem, NotificationList };
