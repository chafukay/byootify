import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, Search, ShoppingBag, User, Menu, X,
  Calendar, MessageCircle, Bell, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", href: "/", active: location === "/" },
    { icon: Search, label: "Search", href: "/search", active: location.includes("/search") },
    { icon: ShoppingBag, label: "Shop", href: "/shop", active: location.includes("/shop") },
    { icon: User, label: "Profile", href: isAuthenticated ? "/dashboard" : "/api/login", active: location.includes("/dashboard") || location.includes("/profile") },
  ];

  const menuItems = [
    { icon: Calendar, label: "My Bookings", href: "/bookings" },
    { icon: MessageCircle, label: "Messages", href: "/messages" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      {/* Top Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#F25D22] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Byootify</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pt-20">
                {isAuthenticated ? (
                  <div className="space-y-6">
                    {/* User Profile */}
                    <div className="flex items-center space-x-3 pb-4 border-b">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                        <span className="text-[#F25D22] font-bold">
                          {user?.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user?.firstName || 'User'}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-2">
                      {menuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <item.icon className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-900">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Sign Out */}
                    <div className="pt-4 border-t">
                      <a
                        href="/api/logout"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                        <span>Sign Out</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-6">Sign in to access all features</p>
                    <Link href="/api/login" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-[#F25D22] hover:bg-[#E04A1A]">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center p-2 transition-colors ${
                item.active 
                  ? 'text-[#F25D22]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                <item.icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}