import { redirect } from 'next/navigation';

/** Старый URL: перенаправляем на раздел владельца. */
export default function LegacySupportRedirectPage() {
  redirect('/dashboard/owner-messages');
}
