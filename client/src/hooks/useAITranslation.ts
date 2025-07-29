import { useState, useEffect, useRef } from 'react';
import { translateText, clearTranslationCache } from '@/lib/aiTranslator';
import { useTranslation } from 'react-i18next';
import React from 'react';

// Hook for AI-powered translation of single text
export function useAITranslation(text: string): string {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const originalTextRef = useRef(text);

  useEffect(() => {
    // Update original text reference when text changes
    originalTextRef.current = text;
    
    // If language is English or text is empty, return original
    if (language === 'en' || !text.trim()) {
      setTranslatedText(text);
      return;
    }

    // Translate text using AI
    const doTranslation = async () => {
      setIsLoading(true);
      try {
        const translated = await translateText(text, language);
        // Only update if the original text hasn't changed
        if (originalTextRef.current === text) {
          setTranslatedText(translated);
        }
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(text); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    doTranslation();
  }, [text, language]);

  // Clear cache when language changes
  useEffect(() => {
    clearTranslationCache();
  }, [language]);

  return translatedText;
}

// Hook for AI-powered translation of multiple texts
export function useAITranslationBatch(texts: string[]): { translatedTexts: string[]; isLoading: boolean } {
  const { i18n } = useTranslation();
  const language = i18n.language;
  const [translatedTexts, setTranslatedTexts] = useState(texts);
  const [isLoading, setIsLoading] = useState(false);
  const originalTextsRef = useRef(texts);

  useEffect(() => {
    // Update original texts reference
    originalTextsRef.current = texts;
    
    // If language is English or no texts, return original
    if (language === 'en' || texts.length === 0) {
      setTranslatedTexts(texts);
      return;
    }

    // Batch translate texts using AI
    const doBatchTranslation = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/translate/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            texts: texts,
            targetLanguage: language
          })
        });

        if (!response.ok) {
          throw new Error('Translation request failed');
        }

        const data = await response.json();
        
        // Only update if the original texts haven't changed
        if (JSON.stringify(originalTextsRef.current) === JSON.stringify(texts)) {
          setTranslatedTexts(data.translatedTexts || texts);
        }
      } catch (error) {
        console.error('Batch translation failed:', error);
        setTranslatedTexts(texts); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    doBatchTranslation();
  }, [JSON.stringify(texts), language]);

  // Clear cache when language changes
  useEffect(() => {
    clearTranslationCache();
  }, [language]);

  return { translatedTexts, isLoading };
}

// Simple component wrapper for AI translation
export function AITranslate({ text, className }: { text: string; className?: string }) {
  const translatedText = useAITranslation(text);
  
  return React.createElement('span', { className }, translatedText);
}

// Hook for translating component children
export function useTranslateChildren(children: string | React.ReactNode): string | React.ReactNode {
  const { i18n } = useTranslation();
  
  // Only translate string children
  if (typeof children === 'string') {
    return useAITranslation(children);
  }
  
  return children;
}