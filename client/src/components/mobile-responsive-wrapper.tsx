import { ReactNode } from "react";
import { useMobile } from "@/hooks/use-mobile";
import MobileNavigation from "@/components/mobile-navigation";
import Navigation from "@/components/navigation";

interface MobileResponsiveWrapperProps {
  children: ReactNode;
  showNavigation?: boolean;
  className?: string;
}

export default function MobileResponsiveWrapper({ 
  children, 
  showNavigation = true, 
  className = "" 
}: MobileResponsiveWrapperProps) {
  const { isMobile } = useMobile();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {showNavigation && (
        isMobile ? <MobileNavigation /> : <Navigation />
      )}
      
      <main className={`${
        isMobile 
          ? "pt-16 pb-20" // Account for mobile header and bottom nav
          : "pt-0" 
      }`}>
        <div className={`${
          isMobile 
            ? "px-4 max-w-full" 
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        }`}>
          {children}
        </div>
      </main>
    </div>
  );
}