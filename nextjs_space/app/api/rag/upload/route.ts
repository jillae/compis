
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processAudioFile, processDocument, processUrl } from '@/lib/rag/knowledge-uploader';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle JSON (URL submission)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { type, url, description } = body;

      if (type !== 'url' || !url) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }

      const result = await processUrl(url, description, session.user.email);
      return NextResponse.json(result);
    }

    // Handle FormData (file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;

      if (!file || !type) {
        return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
      }

      let result;

      if (type === 'audio') {
        result = await processAudioFile(file, session.user.email);
      } else if (type === 'document') {
        result = await processDocument(file, session.user.email);
      } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  } catch (error) {
    console.error('RAG upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}

// File upload handling is built into App Router
