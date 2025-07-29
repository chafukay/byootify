import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import SimpleMobileNav from "@/components/simple-mobile-nav";
import { Menu, Search, User, Calendar, Settings, LogOut, Shield, ShoppingCart, Store, BarChart3, Briefcase, GraduationCap, Rocket, Globe, Smartphone } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import LanguageSwitcher from "@/components/language-switcher";
import byootifyLogo from "@assets/Byootify Logo_1753511686735.png";

export default function Navigation() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { isMobile } = useMobile();

  // Show mobile navigation on mobile devices with error handling
  if (isMobile) {
    try {
      return <SimpleMobileNav />;
    } catch (error) {
      console.error('Mobile navigation error:', error);
      // Fallback to minimal navigation
      return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Link href="/">
              <span className="text-xl font-bold text-gray-900">Byootify</span>
            </Link>
          </div>
        </nav>
      );
    }
  }

  // Get cart items count
  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/shop/cart"],
    enabled: isAuthenticated,
  });

  const navItems = [
    { href: "/search", label: t('navigation.search', 'Search'), icon: Search },
    ...(isAuthenticated ? [{ href: "/bookings", label: t('navigation.myBookings', 'My Bookings'), icon: Calendar }] : []),
    { href: "/shop", label: t('navigation.shop', 'Shop'), icon: Store },
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={location === item.href ? "default" : "ghost"}
              className={`w-full md:w-auto justify-start md:justify-center ${
                location === item.href 
                  ? "bg-[#F25D22] hover:bg-[#E04A1A] text-white" 
                  : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              <IconComponent className="h-4 w-4 mr-2 md:mr-0 md:hidden" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <img 
              src={byootifyLogo} 
              alt="Byootify - Simplify the Beauty Process" 
              className="h-12 cursor-pointer"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavContent />
          </div>

          {/* Cart Icon, Notifications & Language Switcher */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}
            
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {isAuthenticated && cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F25D22] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </Link>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={user.profileImageUrl || undefined} 
                        alt={user.firstName || "User"} 
                      />
                      <AvatarFallback>
                        {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{t('navigation.myBookings', 'My Bookings')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Provider Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/business-analytics" className="flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Business Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/phase-1-mvp" className="flex items-center">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Phase 1 MVP</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/ai-translation-demo" className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" />
                      <span>AI Translation Demo</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/byootify-university" className="flex items-center">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <span>Byootify University</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/deployment-dashboard" className="flex items-center">
                      <Rocket className="mr-2 h-4 w-4" />
                      <span>Deployment Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mobile-app-development" className="flex items-center">
                      <Smartphone className="mr-2 h-4 w-4" />
                      <span>Mobile App Development</span>
                    </Link>
                  </DropdownMenuItem>

                  {user?.role === "super_admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/super-admin" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Super Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onClick={() => window.location.href = "/api/logout"}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('navigation.signOut', 'Sign Out')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => window.location.href = "/api/login"}>
                  {t('navigation.signIn', 'Sign In')}
                </Button>
                <Button onClick={() => window.location.href = "/api/login"}>
                  {t('common.register', 'Sign Up')}
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    <NavContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
