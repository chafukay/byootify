import { useState, useEffect } from "react";

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    const checkIsMobile = () => {
      // Add safety check for window object
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      
      // Update screen size - mobile is anything under 768px
      if (width < 480) {
        setScreenSize('xs');
        setIsMobile(true);
      } else if (width < 640) {
        setScreenSize('sm');
        setIsMobile(true);
      } else if (width < 768) {
        setScreenSize('md');
        setIsMobile(true);
      } else if (width < 1024) {
        setScreenSize('lg');
        setIsMobile(false);
      } else {
        setScreenSize('xl');
        setIsMobile(false);
      }
    };

    // Check on mount
    checkIsMobile();

    // Add event listener with error handling
    try {
      window.addEventListener('resize', checkIsMobile);
    } catch (error) {
      console.warn('Failed to add resize listener:', error);
    }

    // Cleanup
    return () => {
      try {
        window.removeEventListener('resize', checkIsMobile);
      } catch (error) {
        console.warn('Failed to remove resize listener:', error);
      }
    };
  }, []);

  // Safe touch device detection
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0));

  return {
    isMobile,
    screenSize,
    isTouchDevice,
    isTablet: screenSize === 'md' || screenSize === 'lg',
    isPhone: screenSize === 'xs' || screenSize === 'sm',
  };
}