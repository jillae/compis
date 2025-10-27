
/**
 * SuperAdmin Voice Tickets Page
 * Handles fallback voice calls that AI couldn't process
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { VoiceTicketsManager } from '@/components/superadmin/voice-tickets-manager';

export const metadata: Metadata = {
  title: 'Voice Tickets - SuperAdmin',
  description: 'Manage voice call fallback tickets',
};

export default async function VoiceTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <VoiceTicketsManager />
    </div>
  );
}
