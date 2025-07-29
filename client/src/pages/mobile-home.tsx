import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SimpleMobileNav from "@/components/simple-mobile-nav";
import Footer from "@/components/footer";
import { Search, Star, MapPin, Clock, Scissors, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function MobileHome() {
  const [, setLocation] = useLocation();
  
  const { data: featuredProviders = [] } = useQuery<any[]>({
    queryKey: ["/api/providers/featured"],
  });

  const services = [
    { icon: Scissors, name: "Haircuts", color: "bg-purple-100 text-purple-600" },
    { icon: Sparkles, name: "Makeup", color: "bg-pink-100 text-pink-600" },
    { icon: Star, name: "Nails", color: "bg-blue-100 text-blue-600" },
  ];

  const handleFindProviders = () => {
    try {
      setLocation("/search");
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = "/search";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleMobileNav />
      
      <div className="pt-20 pb-20 px-4"> {/* Account for fixed header and bottom nav */}
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#F25D22] to-[#E04A1A] rounded-2xl p-8 text-center text-white mb-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-3">
            Staying Beautiful<br />
            Shouldn't be Stressful
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Find and book with top-rated beauty professionals near you
          </p>
          <Button 
            onClick={handleFindProviders}
            className="w-full bg-white text-[#F25D22] hover:bg-gray-100 font-semibold py-3 text-lg"
          >
            <Search className="h-5 w-5 mr-2" />
            Find Beauty Providers
          </Button>
        </div>

        {/* Quick Services */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Services</h2>
          <div className="grid grid-cols-3 gap-4">
            {services.map((service) => (
              <button
                key={service.name}
                onClick={handleFindProviders}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className={`w-14 h-14 rounded-full ${service.color} flex items-center justify-center mx-auto mb-3`}>
                  <service.icon className="h-7 w-7" />
                </div>
                <span className="text-sm font-semibold text-gray-900">{service.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Providers */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Providers</h2>
          <div className="space-y-4">
            {featuredProviders.slice(0, 3).map((provider: any) => (
              <button
                key={provider.id}
                onClick={() => setLocation(`/provider/${provider.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-[#F25D22] font-bold text-lg">
                      {provider.businessName?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {provider.businessName || 'Beauty Provider'}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                        <span className="font-medium">{provider.rating || '4.8'}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{provider.city || 'Local'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shop Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Beauty Products</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/shop")}
              className="text-[#F25D22]"
            >
              View All
            </Button>
          </div>
          <button
            onClick={() => setLocation("/shop")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-2">Shop Professional Products</h3>
            <p className="text-sm opacity-90">Get the same products your favorite providers use</p>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}