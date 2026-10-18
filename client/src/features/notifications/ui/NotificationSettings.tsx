'use client';

import React from 'react';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useNotificationStore } from '../model/notification.store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Slider } from '@/shared/ui/slider';

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const {
    soundEnabled,
    vibrationEnabled,
    toggleSound,
    toggleVibration,
    preferences,
    setShowOnlyUnread,
    setGroupByType,
    setMaxPerGroup,
    setHiddenCategories,
    setEnableVirtualization,
    setMasterVolume,
    setTypeSound,
  } = useNotificationStore();

  return (
    <Card
      className={`w-full ${className} rounded-xl shadow-lg border transition-all duration-300 ease-in-out`}
    >
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6 sm:pt-5 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          Настройки уведомлений
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col gap-2">
          <Label className="text-foreground font-medium">Громкость уведомлений</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[Math.round(preferences.sound.masterVolume * 100)]}
              onValueChange={(v) => setMasterVolume((v?.[0] || 0) / 100)}
              max={100}
              step={1}
              className="w-44"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(preferences.sound.masterVolume * 100)}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-toggle" className="text-foreground font-medium">
            Звуковые уведомления
          </Label>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={toggleSound}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="vibration-toggle" className="text-foreground font-medium">
            Вибрация
          </Label>
          <Switch
            id="vibration-toggle"
            checked={vibrationEnabled}
            onCheckedChange={toggleVibration}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="unread-toggle" className="text-foreground font-medium">
            Показывать только непрочитанные
          </Label>
          <Switch
            id="unread-toggle"
            checked={preferences.showOnlyUnread}
            onCheckedChange={setShowOnlyUnread}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="group-toggle" className="text-foreground font-medium">
            Группировать по типам
          </Label>
          <Switch
            id="group-toggle"
            checked={preferences.groupByType}
            onCheckedChange={setGroupByType}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-foreground font-medium">Лимит на группу</Label>
            <Select
              value={String(preferences.maxPerGroup)}
              onValueChange={(v) => setMaxPerGroup(Number(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Выберите лимит" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="virt-toggle" className="text-foreground font-medium">
              Виртуализация
            </Label>
            <Switch
              id="virt-toggle"
              checked={preferences.enableVirtualization}
              onCheckedChange={setEnableVirtualization}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-foreground font-medium">Звук по категориям</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['security', 'payment', 'delivery', 'order'] as const).map((typeKey) => {
              const cfg = preferences.sound.perType[typeKey] || { frequency: 800, volume: 0.3 };
              return (
                <div key={typeKey} className="border rounded-md p-3">
                  <div className="text-sm font-medium mb-2">{typeKey}</div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <Label className="text-xs">Громкость</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[Math.round(cfg.volume * 100)]}
                        onValueChange={(v) =>
                          setTypeSound(typeKey, { ...cfg, volume: (v?.[0] || 0) / 100 })
                        }
                        max={100}
                        step={1}
                        className="w-40"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {Math.round(cfg.volume * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs">Частота (Гц)</Label>
                    <input
                      type="number"
                      value={cfg.frequency}
                      onChange={(e) =>
                        setTypeSound(typeKey, { ...cfg, frequency: Number(e.target.value || 0) })
                      }
                      className="h-8 w-24 rounded-md border bg-background px-2 text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-foreground font-medium">Скрыть категории</Label>
          <div className="flex flex-wrap gap-2">
            {['order', 'product', 'system', 'promotional', 'security', 'payment', 'delivery'].map(
              (type) => {
                const t = type as any;
                const active = !preferences.hiddenCategories.includes(t);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? [...preferences.hiddenCategories, t]
                        : preferences.hiddenCategories.filter((x) => x !== t);
                      setHiddenCategories(next as any);
                    }}
                    className={`px-2 py-1 rounded-md border text-xs ${
                      active
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                    aria-pressed={active}
                  >
                    {type}
                  </button>
                );
              }
            )}
          </div>
          {preferences.hiddenCategories.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Скрыто:{' '}
              {preferences.hiddenCategories.map((c) => (
                <Badge key={c} variant="secondary" className="mr-1">
                  {c}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { NotificationSettings };
