import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobileSearchBar from "@/components/mobile-search-bar";
import MobileProviderCard from "@/components/mobile-provider-card";
import { useAuth } from "@/hooks/useAuth";
import { 
  Clock, Zap,
  Calendar, ShoppingBag, Gift
} from "lucide-react";
import { motion } from "framer-motion";

export default function MobileHome() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: featuredProviders = [] } = useQuery<any[]>({
    queryKey: ["/api/providers/featured"],
  });

  const { data: nearbyProviders = [] } = useQuery<any[]>({
    queryKey: ["/api/providers/nearby"],
  });

  const { data: recentBookings = [] } = useQuery<any[]>({
    queryKey: ["/api/bookings/recent"],
    enabled: isAuthenticated,
  });

  const categories = [
    { id: "hair", name: "Hair", icon: "💇‍♀️", color: "from-pink-400 to-pink-600" },
    { id: "nails", name: "Nails", icon: "💅", color: "from-purple-400 to-purple-600" },
    { id: "makeup", name: "Makeup", icon: "💄", color: "from-red-400 to-red-600" },
    { id: "spa", name: "Spa", icon: "🧴", color: "from-blue-400 to-blue-600" },
    { id: "massage", name: "Massage", icon: "💆‍♀️", color: "from-green-400 to-green-600" },
    { id: "skincare", name: "Skincare", icon: "🧖‍♀️", color: "from-yellow-400 to-yellow-600" },
  ];

  const quickActions = [
    { icon: Calendar, label: "Book Now", href: "/search", color: "bg-[#F25D22]" },
    { icon: ShoppingBag, label: "Shop", href: "/shop", color: "bg-purple-500" },
    { icon: Gift, label: "Offers", href: "/offers", color: "bg-green-500" },
  ];

  return (
    <div className="pt-20 pb-20 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="px-4 py-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAuthenticated ? `Hi, ${user?.firstName || 'there'}!` : 'Welcome to Byootify'}
            </h1>
            <p className="text-gray-600">Find your perfect beauty provider</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>

        {/* Search Bar */}
        <MobileSearchBar 
          onSearchChange={(location, service) => {
            const params = new URLSearchParams();
            if (location) params.set("location", location);
            if (service) params.set("category", service);
            window.location.href = `/search?${params.toString()}`;
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          {quickActions.map((action, index) => (
            <Link key={action.href} href={action.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1"
              >
                <Card className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 text-center">
                    <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse Categories</h2>
        <div className="grid grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/search?category=${category.id}`}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4 text-center">
                    <div className={`bg-gradient-to-r ${category.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-xl">{category.icon}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bookings (for authenticated users) */}
      {isAuthenticated && recentBookings.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            <Link href="/bookings">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentBookings.slice(0, 2).map((booking: any) => (
              <Card key={booking.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-[#F25D22] font-bold">
                        {booking.provider?.businessName?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {booking.provider?.businessName}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{booking.appointmentDate}</span>
                        <Clock className="h-3 w-3 ml-2 mr-1" />
                        <span>{booking.appointmentTime}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Featured Providers */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Featured Providers</h2>
          <Link href="/search">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-4">
          {featuredProviders.slice(0, 3).map((provider: any) => (
            <MobileProviderCard
              key={provider.id}
              provider={provider}
              compact={true}
            />
          ))}
        </div>
      </div>

      {/* Special Offers */}
      <div className="px-4 py-6">
        <Card className="bg-gradient-to-r from-[#F25D22] to-[#E04A1A] text-white">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Zap className="h-8 w-8 mr-2" />
              <h2 className="text-xl font-bold">Special Offer</h2>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Book your first appointment and get 20% off!
            </p>
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white text-[#F25D22] hover:bg-gray-50"
            >
              Book Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Spacing for Navigation */}
      <div className="h-20" />
    </div>
  );
}