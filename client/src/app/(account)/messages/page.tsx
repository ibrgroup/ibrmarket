import { MessagesPage } from '@/features/chat';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Сообщения',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="max-container mx-auto px-4 py-12 text-center text-sm text-muted-foreground">
          Загрузка…
        </div>
      }
    >
      <MessagesPage />
    </Suspense>
  );
}
