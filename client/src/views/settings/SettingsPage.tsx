'use client';

import dynamic from 'next/dynamic';

const SettingsPageContent = dynamic(
  () => import('./SettingsPageContent').then((m) => ({ default: m.SettingsPageContent })),
  {
    ssr: false,
    loading: () => (
      <div className="max-container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-accent" />
          <div className="h-64 animate-pulse rounded-2xl bg-accent" />
        </div>
      </div>
    ),
  },
);

export function SettingsPage() {
  return <SettingsPageContent />;
}
