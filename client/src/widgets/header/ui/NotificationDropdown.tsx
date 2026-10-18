'use client';

import { useEffect, useState, useRef, type FC } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { NotificationList } from '@/features/notifications';
import { useNotificationStore } from '@/features/notifications';
import { useIsMobile, useIsXs } from '@/shared/hooks/use-mobile';
import { BsBell } from 'react-icons/bs';

interface NotificationDropdownProps {
  isDropdown?: boolean; // Use dropdown instead of hover card
}

const NotificationDropdown: FC<NotificationDropdownProps> = ({ isDropdown = true }) => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    apiMarkAsRead,
    apiMarkAllAsRead,
    apiRemove,
    apiClearAll,
    trackOpened,
    trackInteraction,
    trackEvent,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isXs = useIsXs();

  // Функция для закрытия
  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Загружаем уведомления при монтировании компонента
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Обработчик клика вне области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Функция для переключения состояния открытия
  const toggleDropdown = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      trackOpened();
      trackEvent('dropdown_opened');
    } else {
      trackInteraction();
      trackEvent('dropdown_closed');
    }
  };

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 focus-visible:ring-ring group relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition focus-visible:ring-2 md:h-12 md:w-12"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label="Уведомления"
      onClick={toggleDropdown}
    >
      <BsBell className="text-indigo-500 group-hover:text-indigo-500 h-6 w-6 transition-colors duration-200 md:h-7 md:w-7" />
      {unreadCount > 0 && (
        <Badge
          variant="default"
          className="border-background dark:border-background absolute -top-1 -right-1 flex h-5 w-5 min-w-[1.25rem] items-center justify-center rounded-full border p-0 text-xs font-semibold shadow-lg"
          title="Есть новые уведомления"
        >
          {unreadCount}
        </Badge>
      )}
    </Button>
  );

  // Для мобильных устройств используем Popover, для десктопа - Dropdown
  if (isMobile || !isDropdown) {
    return (
      <div ref={dropdownRef}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            align="end"
            className={`w-full max-w-[95vw] ${isXs ? 'max-w-xs' : ''} mt-1 p-0 sm:max-w-sm ${
              isXs ? 'mt-2' : ''
            } bg-popover text-popover-foreground rounded-xl border shadow-lg ${
              isOpen ? 'animate-dropdown-open' : 'animate-dropdown-close'
            } max-h-[80vh] overflow-hidden sm:max-h-[520px]`}
            onClick={e => e.stopPropagation()}
          >
            <NotificationList
              notifications={notifications}
              onMarkAsRead={async id => {
                markAsRead(id);
                trackEvent('mark_read', { id });
                apiMarkAsRead(id);
              }}
              onMarkAllAsRead={async () => {
                markAllAsRead();
                trackEvent('mark_all_read');
                apiMarkAllAsRead();
              }}
              onClear={async id => {
                removeNotification(id);
                trackEvent('remove', { id });
                apiRemove(id);
              }}
              onClearAll={async () => {
                clearAll();
                trackEvent('clear_all');
                apiClearAll();
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div ref={dropdownRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          align="end"
          className={`w-full max-w-[95vw] ${isXs ? 'max-w-xs' : ''} mt-1 p-0 sm:max-w-sm ${
            isXs ? 'mt-2' : ''
          } bg-popover text-popover-foreground rounded-xl border shadow-lg ${
            isOpen ? 'animate-dropdown-open' : 'animate-dropdown-close'
          } max-h-[80vh] overflow-hidden sm:max-h-[520px]`}
          onClick={e => e.stopPropagation()}
        >
          <NotificationList
            notifications={notifications}
            onMarkAsRead={async id => {
              markAsRead(id);
              trackEvent('mark_read', { id });
              apiMarkAsRead(id);
            }}
            onMarkAllAsRead={async () => {
              markAllAsRead();
              trackEvent('mark_all_read');
              apiMarkAllAsRead();
            }}
            onClear={async id => {
              removeNotification(id);
              trackEvent('remove', { id });
              apiRemove(id);
            }}
            onClearAll={async () => {
              clearAll();
              trackEvent('clear_all');
              apiClearAll();
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationDropdown;
