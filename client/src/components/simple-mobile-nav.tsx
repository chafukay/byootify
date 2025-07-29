import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, Search, ShoppingBag, User, Menu
} from "lucide-react";

export default function SimpleMobileNav() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Don't render during loading to prevent crashes
  if (isLoading) {
    return null;
  }

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: ShoppingBag, label: "Shop", href: "/shop" },
    { icon: User, label: isAuthenticated ? "Profile" : "Login", href: isAuthenticated ? "/dashboard" : "/api/login" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <>
      {/* Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#F25D22] to-[#E04A1A] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Byootify</span>
            </div>
          </Link>
          <Button variant="ghost" size="sm">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`h-full w-full flex-col space-y-1 rounded-none ${
                  isActive(item.href) 
                    ? "text-purple-600 bg-purple-50" 
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
                {isActive(item.href) && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-purple-600 rounded-full" />
                )}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Content Spacers */}
      <div className="md:hidden h-16" /> {/* Top spacer */}
      <div className="md:hidden h-16" /> {/* Bottom spacer at end of content */}
    </>
  );
}