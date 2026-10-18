'use client';

import { designTokens } from '@/shared/config/design-tokens';
import { useTheme } from '@/shared/hooks';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { Palette, Ruler, Square, Type } from 'lucide-react';
import { useState } from 'react';

export function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState('colors');
  const { theme, actualTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div>Загрузка...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'colors', label: 'Цвета', icon: Palette },
    { id: 'typography', label: 'Шрифты', icon: Type },
    { id: 'spacing', label: 'Отступы', icon: Ruler },
    { id: 'components', label: 'Компоненты', icon: Square },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Дизайн-система IBR-MARKET</h1>
              <Badge variant="secondary">Фиолетовая тема</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Тема:</span>
                <Badge variant="outline">{theme}</Badge>
                <Badge variant="outline">{actualTheme}</Badge>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Разделы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'colors' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Цветовая палитра</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Основные цвета</h3>
                    <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                      {Object.entries(designTokens.colors.primary).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div
                            className="mx-auto mb-2 h-12 w-12 rounded-lg border"
                            style={{ backgroundColor: value }}
                          />
                          <div className="text-xs text-muted-foreground">{key}</div>
                          <div className="text-xs font-mono">{value.slice(0, 7)}...</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Серые цвета</h3>
                    <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                      {Object.entries(designTokens.colors.gray).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div
                            className="mx-auto mb-2 h-12 w-12 rounded-lg border"
                            style={{ backgroundColor: value }}
                          />
                          <div className="text-xs text-muted-foreground">{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Семантические цвета</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {Object.entries(designTokens.colors.semantic).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div
                            className="mx-auto mb-2 h-16 w-16 rounded-lg border"
                            style={{ backgroundColor: value.light }}
                          />
                          <div className="text-sm font-medium capitalize">{key}</div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {value.light.slice(0, 7)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'typography' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Type className="h-5 w-5" />
                    <span>Шрифтовая система</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Размеры текста</h3>
                    <div className="space-y-4">
                      {Object.entries(designTokens.typography.fontSize).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-4">
                          <div className="w-16 text-sm text-muted-foreground">{key}</div>
                          <div className="font-medium" style={{ fontSize: value }}>
                            The quick brown fox jumps over the lazy dog
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Начертания</h3>
                    <div className="space-y-3">
                      {Object.entries(designTokens.typography.fontWeight).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-4">
                          <div className="w-20 text-sm capitalize text-muted-foreground">{key}</div>
                          <div className="text-lg" style={{ fontWeight: value }}>
                            The quick brown fox jumps over the lazy dog
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Межбуквенные расстояния</h3>
                    <div className="space-y-3">
                      {Object.entries(designTokens.typography.lineHeight).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-4">
                          <div className="w-20 text-sm capitalize text-muted-foreground">{key}</div>
                          <div className="text-base" style={{ lineHeight: value }}>
                            The quick brown fox jumps over the lazy dog. This text demonstrates
                            different line heights and how they affect readability.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'spacing' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Ruler className="h-5 w-5" />
                    <span>Система отступов</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Отступы</h3>
                    <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
                      {Object.entries(designTokens.spacing).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="mb-2 rounded border-2 border-dashed border-primary/40 bg-primary/20 p-2">
                            <div
                              className="rounded-sm bg-primary"
                              style={{ width: value, height: value }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">{key}</div>
                          <div className="text-xs font-mono">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Радиусы скругления</h3>
                    <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
                      {Object.entries(designTokens.borderRadius).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="mb-2 h-12 bg-primary" style={{ borderRadius: value }} />
                          <div className="text-xs text-muted-foreground">{key}</div>
                          <div className="text-xs font-mono">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'components' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Square className="h-5 w-5" />
                    <span>UI Компоненты</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Кнопки</h3>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Button>Основная</Button>
                        <Button variant="secondary">Вторичная</Button>
                        <Button variant="outline">Контур</Button>
                        <Button variant="ghost">Призрачная</Button>
                        <Button variant="destructive">Опасная</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm">Маленькая</Button>
                        <Button size="lg">Большая</Button>
                        <Button disabled>Отключена</Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Поля ввода</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="user@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Пароль</Label>
                        <Input id="password" type="password" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Бейджи</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge>По умолчанию</Badge>
                      <Badge variant="secondary">Вторичный</Badge>
                      <Badge variant="destructive">Опасный</Badge>
                      <Badge variant="outline">Контур</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Карточки</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Заголовок карточки</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Содержимое карточки с описанием и дополнительной информацией.
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="mb-4 aspect-video rounded-lg bg-muted" />
                          <h3 className="mb-2 font-medium">Изображение</h3>
                          <p className="text-sm text-muted-foreground">
                            Карточка с изображением и описанием.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
