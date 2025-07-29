import { useAITranslation } from '@/hooks/useAITranslation';

interface AITranslateProps {
  children: string;
  className?: string;
  fallback?: string;
}

export function AITranslate({ children, className, fallback }: AITranslateProps) {
  const translatedText = useAITranslation(children);
  
  return (
    <span className={className}>
      {translatedText || fallback || children}
    </span>
  );
}

// Helper component for headings
export function AITranslateHeading({ 
  children, 
  className, 
  as: Component = 'h1' 
}: { 
  children: string; 
  className?: string; 
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' 
}) {
  const translatedText = useAITranslation(children);
  
  return (
    <Component className={className}>
      {translatedText}
    </Component>
  );
}

// Helper component for paragraphs
export function AITranslateParagraph({ children, className }: { children: string; className?: string }) {
  const translatedText = useAITranslation(children);
  
  return (
    <p className={className}>
      {translatedText}
    </p>
  );
}

// Helper component for buttons
export function AITranslateButton({ 
  children, 
  className, 
  onClick,
  ...props 
}: { 
  children: string; 
  className?: string; 
  onClick?: () => void;
  [key: string]: any;
}) {
  const translatedText = useAITranslation(children);
  
  return (
    <button className={className} onClick={onClick} {...props}>
      {translatedText}
    </button>
  );
}