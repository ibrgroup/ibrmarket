import { AdminSettingsPanel } from '@/features/admin-data';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';

export default function Page() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Настройки"
        description="Публичная сводка окружения. Секреты никогда не отдаются в браузер."
      />
      <AdminSettingsPanel />
    </div>
  );
}
