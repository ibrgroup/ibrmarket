'use client';

import { adminMetricsService } from '@/shared/api/services/admin-metrics-service';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, Server, Store } from 'lucide-react';
import Link from 'next/link';

function swaggerDocsUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  const base = raw.replace(/\/?api\/?$/i, '');
  return `${base.replace(/\/+$/, '')}/docs`;
}

export function AdminSettingsPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminMetricsService.getSettings(),
    staleTime: 120_000,
  });

  const docs = swaggerDocsUrl();

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Загрузка настроек…</p>;
  }

  if (isError || !data) {
    return <p className="text-muted-foreground text-sm">Не удалось загрузить сводку окружения.</p>;
  }

  return (
    <Tabs defaultValue="environment" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-200">
        <TabsTrigger value="environment" className="gap-2 cursor-pointer">
          <Server className="size-4" aria-hidden />
          Окружение
        </TabsTrigger>
        <TabsTrigger value="docs" className="gap-2 cursor-pointer">
          <BookOpen className="size-4" aria-hidden />
          API и ссылки
        </TabsTrigger>
      </TabsList>

      <TabsContent value="environment" className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Окружение (без секретов)</CardTitle>
            <CardDescription>Только флаги наличия интеграций, без ключей.</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              <span className="text-foreground font-medium">NODE_ENV:</span> {data.nodeEnv}
            </p>
            <p>
              <span className="text-foreground font-medium">FRONTEND_URL:</span>{' '}
              {data.frontendUrl ?? '—'}
            </p>
            <p>
              <span className="text-foreground font-medium">ЮKassa:</span>{' '}
              {data.hasYooKassa ? 'настроена' : 'не настроена'}
            </p>
            <p>
              <span className="text-foreground font-medium">Cloudinary:</span>{' '}
              {data.hasCloudinary ? 'настроена' : 'не настроена'}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="docs" className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Документация API</CardTitle>
            <CardDescription>
              Краткая карта админ-эндпоинтов: <code className="text-xs">docs/ADMIN_API.md</code>.
              OpenAPI: <code className="text-xs">/docs/openapi.json</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {docs ? (
              <Button variant="outline" size="sm" asChild>
                <a href={docs} target="_blank" rel="noopener noreferrer" className="gap-2">
                  Swagger
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Задайте <code className="text-xs">NEXT_PUBLIC_API_URL</code> — ссылка подставится
                автоматически.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Витрина</CardTitle>
            <CardDescription>
              Главная страница магазина на этом же домене (корень сайта).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/" className="gap-2">
                <Store className="size-4" aria-hidden />
                Открыть магазин
              </Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
