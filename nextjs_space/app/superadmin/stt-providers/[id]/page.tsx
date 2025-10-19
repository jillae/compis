
/**
 * Superadmin STT Provider Edit Page
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OpenAIWhisperConfig } from '@/components/superadmin/openai-whisper-config';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Edit STT Provider - Superadmin',
  description: 'Configure Speech-to-Text provider settings',
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function STTProviderEditPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const { id } = await params;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/superadmin/stt-providers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till providers
          </Button>
        </Link>
      </div>

      {/* Configuration Component */}
      <OpenAIWhisperConfig providerId={id} />
    </div>
  );
}
