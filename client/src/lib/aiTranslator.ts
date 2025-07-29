import { apiRequest } from './queryClient';

// Cache for translated content to avoid repeated API calls
const translationCache = new Map<string, string>();

// Generate cache key for translations
function getCacheKey(text: string, targetLanguage: string): string {
  return `${targetLanguage}:${text}`;
}

// AI-powered translation function
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  // Return original text if it's English or empty
  if (targetLanguage === 'en' || !text.trim()) {
    return text;
  }

  // Check cache first
  const cacheKey = getCacheKey(text, targetLanguage);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Call AI translation API
    const response = await apiRequest('POST', '/api/translate', {
      text: text,
      targetLanguage: targetLanguage
    });

    const data = await response.json();
    const translatedText = data.translatedText || text;
    
    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Translation failed:', error);
    // Return original text if translation fails
    return text;
  }
}

// Batch translation for multiple texts
export async function translateTexts(texts: string[], targetLanguage: string): Promise<string[]> {
  if (targetLanguage === 'en') {
    return texts;
  }

  try {
    const response = await apiRequest('POST', '/api/translate/batch', {
      texts: texts,
      targetLanguage: targetLanguage
    });

    const data = await response.json();
    return data.translatedTexts || texts;
  } catch (error) {
    console.error('Batch translation failed:', error);
    return texts;
  }
}

// Clear translation cache (useful when language changes)
export function clearTranslationCache(): void {
  translationCache.clear();
}

// Language code mapping for better AI understanding
export const languageNames: Record<string, string> = {
  'en': 'English',
  'zh': 'Chinese (Simplified)',
  'es': 'Spanish',
  'fr': 'French',
  'ar': 'Arabic'
};