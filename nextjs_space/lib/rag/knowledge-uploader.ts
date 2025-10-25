
import { prisma } from '@/lib/db';
import { generateEmbedding } from './embeddings';
import { chunkText } from './chunking';
import * as cheerio from 'cheerio';

/**
 * Process audio file - transcribe using OpenAI Whisper and chunk
 */
export async function processAudioFile(file: File, userEmail: string) {
  try {
    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      throw new Error('No clinic associated with user');
    }

    // Get OpenAI API key from environment or Abacus secrets
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Transcribe using OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), file.name);
    formData.append('model', 'whisper-1');
    formData.append('language', 'sv');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const transcription = await response.json();
    const text = transcription.text;

    // Chunk and store
    const chunks = chunkText(text, {
      maxChunkSize: 800,
      overlap: 100,
    });

    let chunksCreated = 0;

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);

      await prisma.knowledgeChunk.create({
        data: {
          clinicId: user.clinic.id,
          content: chunk.text,
          contentType: 'review',  // Type for transcribed conversations
          sourceUrl: file.name,
          sourceType: 'manual',
          keywords: ['telefonsamtal', 'transkrip  tion', 'kundsamtal'],
          embedding: embedding,
        },
      });

      chunksCreated++;
    }

    return {
      success: true,
      chunksCreated,
      source: file.name,
    };
  } catch (error) {
    console.error('Audio processing error:', error);
    throw error;
  }
}

/**
 * Process document - extract text from PDF/DOCX and chunk
 */
export async function processDocument(file: File, userEmail: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      throw new Error('No clinic associated with user');
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = '';

    // Extract text based on file type
    if (file.name.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else if (file.name.endsWith('.pdf')) {
      // Use pdf-parse library
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // Use mammoth library for Word docs
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      throw new Error('Unsupported file format');
    }

    // Chunk and store
    const chunks = chunkText(text, {
      maxChunkSize: 800,
      overlap: 100,
    });

    let chunksCreated = 0;

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);

      await prisma.knowledgeChunk.create({
        data: {
          clinicId: user.clinic.id,
          content: chunk.text,
          contentType: 'booking_info',  // Generic type for documents
          sourceUrl: file.name,
          sourceType: 'manual',
          keywords: ['dokument', 'information', file.name.replace(/\.[^/.]+$/, '')],
          embedding: embedding,
        },
      });

      chunksCreated++;
    }

    return {
      success: true,
      chunksCreated,
      source: file.name,
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

/**
 * Process URL - scrape web page and chunk
 */
export async function processUrl(url: string, description: string | undefined, userEmail: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      throw new Error('No clinic associated with user');
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlowBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse HTML and extract text
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, header, footer').remove();

    // Extract main content
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) {
      throw new Error('No text content found on page');
    }

    // Chunk and store
    const chunks = chunkText(text, {
      maxChunkSize: 800,
      overlap: 100,
    });

    let chunksCreated = 0;

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);

      await prisma.knowledgeChunk.create({
        data: {
          clinicId: user.clinic.id,
          content: chunk.text,
          contentType: 'booking_info',  // Generic type for web pages
          sourceUrl: url,
          sourceType: 'website',
          keywords: ['webbsida', url.split('/').pop() || 'sida'],
          embedding: embedding,
        },
      });

      chunksCreated++;
    }

    return {
      success: true,
      chunksCreated,
      source: url,
    };
  } catch (error) {
    console.error('URL processing error:', error);
    throw error;
  }
}
