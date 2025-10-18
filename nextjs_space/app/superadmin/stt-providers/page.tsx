
/**
 * Superadmin STT Providers Page
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { STTProviderManager } from '@/components/superadmin/STTProviderManager';

export const metadata: Metadata = {
  title: 'STT Providers - Superadmin',
  description: 'Manage Speech-to-Text providers',
};

export default async function STTProvidersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <STTProviderManager />
    </div>
  );
}
