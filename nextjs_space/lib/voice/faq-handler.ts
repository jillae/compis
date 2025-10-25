
// FAQ Handler with search functionality for Voice AI

import { prisma } from '@/lib/db';

/**
 * Search FAQs using keyword matching
 * Used as fallback when RAG/embedding search is not available
 */
export async function searchFAQs(
  query: string,
  clinicId: string,
  limit: number = 5
): Promise<Array<{ question: string; answer: string; score: number }>> {
  try {
    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(' ').filter(word => word.length > 2);

    // Fetch active FAQs for the clinic
    const faqs = await prisma.fAQ.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    // Score each FAQ based on keyword matches
    const scoredFAQs = faqs.map((faq) => {
      let score = 0;
      
      const questionLower = faq.question.toLowerCase();
      const answerLower = faq.answer.toLowerCase();
      const keywordsLower = faq.keywords.map(k => k.toLowerCase());

      // Exact match in question (highest score)
      if (questionLower.includes(normalizedQuery)) {
        score += 100;
      }

      // Word matches in question
      queryWords.forEach((word) => {
        if (questionLower.includes(word)) {
          score += 10;
        }
      });

      // Keyword matches
      queryWords.forEach((word) => {
        if (keywordsLower.some(kw => kw.includes(word))) {
          score += 15;
        }
      });

      // Word matches in answer (lower weight)
      queryWords.forEach((word) => {
        if (answerLower.includes(word)) {
          score += 5;
        }
      });

      // Boost based on priority
      score += faq.priority * 2;

      // Boost based on usage (popular FAQs)
      score += Math.min(faq.timesUsed * 0.1, 10);

      return {
        question: faq.question,
        answer: faq.answer,
        score,
        faqId: faq.id,
      };
    });

    // Sort by score and return top results
    const topFAQs = scoredFAQs
      .filter(faq => faq.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Update usage stats for top match
    if (topFAQs.length > 0 && topFAQs[0].score > 20) {
      await prisma.fAQ.update({
        where: { id: topFAQs[0].faqId },
        data: {
          timesUsed: {
            increment: 1,
          },
          lastUsedAt: new Date(),
        },
      });
    }

    return topFAQs;
  } catch (error) {
    console.error('FAQ search error:', error);
    return [];
  }
}

/**
 * Get all FAQ categories for a clinic
 */
export async function getFAQCategories(clinicId: string): Promise<string[]> {
  try {
    const categories = await prisma.fAQ.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories
      .map(c => c.category)
      .filter((cat): cat is string => cat !== null)
      .sort();
  } catch (error) {
    console.error('Get FAQ categories error:', error);
    return [];
  }
}
