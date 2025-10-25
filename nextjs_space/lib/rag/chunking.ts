
/**
 * RAG Chunking Library
 * Splits knowledge base content into semantic chunks for embedding
 */

export interface RawService {
  service_name: string;
  category: string;
  description?: string;
  duration_min?: number;
  price_sek?: number;
  suitable_for?: string[];
  practitioner?: string[];
  keywords: string[];
  source?: string;
}

export interface KnowledgeChunk {
  content: string;
  contentType: 'service' | 'philosophy' | 'booking_info' | 'review' | 'package' | 'offer';
  category?: string;
  subcategory?: string;
  serviceName?: string;
  duration?: number;
  price?: number;
  practitioner?: string;
  keywords: string[];
  sourceUrl?: string;
  sourceType: 'website' | 'bokadirekt' | 'manual';
}

/**
 * Create a service chunk with full context for RAG retrieval
 */
export function createServiceChunk(service: RawService): KnowledgeChunk {
  // Fix duration if malformed (e.g., 4545 -> 45)
  let duration = service.duration_min;
  if (duration && duration > 300) {
    // Likely a parsing error (e.g., "45" became "4545")
    duration = Math.floor(duration / 100);
  }

  // Build comprehensive content text
  const contentParts: string[] = [];
  
  contentParts.push(`Behandling: ${service.service_name}`);
  contentParts.push(`Kategori: ${service.category}`);
  
  if (service.description) {
    contentParts.push(`\nBeskrivning: ${service.description}`);
  }
  
  if (duration) {
    contentParts.push(`Längd: ${duration} minuter`);
  }
  
  if (service.price_sek) {
    contentParts.push(`Pris: ${service.price_sek} kr`);
  }
  
  if (service.suitable_for && service.suitable_for.length > 0) {
    contentParts.push(`\nLämplig för: ${service.suitable_for.join(', ')}`);
  }
  
  if (service.practitioner && service.practitioner.length > 0) {
    contentParts.push(`Behandlare: ${service.practitioner.join(', ')}`);
  }

  const content = contentParts.join('\n');

  // Extract subcategory from keywords or suitable_for
  const subcategory = service.suitable_for?.[0] || service.keywords[0];

  return {
    content,
    contentType: 'service',
    category: service.category,
    subcategory,
    serviceName: service.service_name,
    duration,
    price: service.price_sek,
    practitioner: service.practitioner?.join(', '),
    keywords: [
      ...service.keywords,
      service.service_name.toLowerCase(),
      ...(service.suitable_for || []),
    ],
    sourceUrl: service.source,
    sourceType: service.source?.includes('bokadirekt') ? 'bokadirekt' : 'website',
  };
}

/**
 * Create a philosophy chunk (Archmethod®, pain concepts, etc.)
 */
export function createPhilosophyChunk(
  title: string,
  content: string,
  keywords: string[]
): KnowledgeChunk {
  return {
    content: `${title}\n\n${content}`,
    contentType: 'philosophy',
    category: 'Filosofi & Metod',
    keywords: [...keywords, 'archmethod', 'filosofi', 'metod'],
    sourceType: 'website',
  };
}

/**
 * Create booking info chunk
 */
export function createBookingInfoChunk(content: string, keywords: string[]): KnowledgeChunk {
  return {
    content,
    contentType: 'booking_info',
    category: 'Bokningsinfo',
    keywords: [...keywords, 'boka', 'bokning', 'tid'],
    sourceType: 'website',
  };
}

/**
 * Create package/klippkort chunk
 */
export function createPackageChunk(
  name: string,
  description: string,
  price: number,
  keywords: string[]
): KnowledgeChunk {
  return {
    content: `${name}\n\n${description}\n\nPris: ${price} kr`,
    contentType: 'package',
    category: 'Klippkort & Paket',
    serviceName: name,
    price,
    keywords: [...keywords, 'klippkort', 'paket', 'rabatt'],
    sourceType: 'website',
  };
}

/**
 * Chunk text by sentences (max 500 tokens per chunk)
 */
export function chunkText(text: string, maxTokens: number = 500): string[] {
  const sentences = text.split(/[.!?]\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = sentence.split(/\s+/).length;
    
    if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = sentenceTokens;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
