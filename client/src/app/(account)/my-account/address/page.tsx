import { Suspense } from 'react';
import { AddressPageContent } from './AddressPageContent';

export const dynamic = 'force-dynamic';

export default function AddressPage() {
  return (
    <Suspense fallback={<div className="max-container mx-auto px-4 py-3">Загрузка...</div>}>
      <AddressPageContent />
    </Suspense>
  );
}
