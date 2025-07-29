import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { 
  Search, Filter, MapPin, Star, Clock, DollarSign, 
  SlidersHorizontal, X, Heart, Phone, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

interface MobileSearchProps {
  onLocationChange?: (location: string) => void;
  onServiceChange?: (service: string) => void;
  onPriceRangeChange?: (range: [number, number]) => void;
}

export default function MobileSearch({ 
  onLocationChange, 
  onServiceChange, 
  onPriceRangeChange 
}: MobileSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch providers based on search criteria
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["/api/providers/search", searchQuery, selectedLocation, selectedService, priceRange],
    enabled: searchQuery.length > 0 || selectedLocation.length > 0 || selectedService.length > 0,
  });

  const { data: popularServices = [] } = useQuery({
    queryKey: ["/api/services/popular"],
  });

  const { data: featuredProviders = [] } = useQuery({
    queryKey: ["/api/providers/featured"],
  });

  useEffect(() => {
    if (searchQuery.length > 0 || selectedLocation.length > 0 || selectedService.length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery, selectedLocation, selectedService]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onServiceChange?.(query);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    onLocationChange?.(location);
  };

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    onServiceChange?.(service);
    setSearchQuery(service);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    onPriceRangeChange?.(range);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLocation("");
    setSelectedService("");
    setPriceRange([0, 500]);
    setShowResults(false);
    onLocationChange?.("");
    onServiceChange?.("");
    onPriceRangeChange?.([0, 500]);
  };

  const popularLocations = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", 
    "Miami, FL", "Atlanta, GA", "Seattle, WA", "Boston, MA"
  ];

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services, treatments, providers..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-12 h-12 text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2"
              onClick={() => handleSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-3">
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {(selectedLocation || selectedService || priceRange[0] > 0 || priceRange[1] < 500) && (
                  <Badge variant="secondary" className="ml-2">
                    {[selectedLocation, selectedService, priceRange[0] > 0 || priceRange[1] < 500 ? "Price" : ""].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>

                {/* Location Filter */}
                <div>
                  <h3 className="font-medium mb-3">Location</h3>
                  <div className="relative mb-3">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Enter city, state, or zip code"
                      value={selectedLocation}
                      onChange={(e) => handleLocationSelect(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularLocations.map((location) => (
                      <Button
                        key={location}
                        variant={selectedLocation === location ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLocationSelect(location)}
                        className="text-xs"
                      >
                        {location}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Service Filter */}
                <div>
                  <h3 className="font-medium mb-3">Popular Services</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {popularServices.map((service: any) => (
                      <Button
                        key={service.name}
                        variant={selectedService === service.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleServiceSelect(service.name)}
                        className="text-xs h-auto py-2 px-3"
                      >
                        {service.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      max={500}
                      min={0}
                      step={25}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}+</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            Near Me
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {showResults ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                          <div className="h-3 bg-gray-200 rounded w-1/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : providers.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {providers.length} providers found
                  </h3>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Sort
                  </Button>
                </div>

                {providers.map((provider: any) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex space-x-4">
                          <div className="relative">
                            <img
                              src={provider.profileImageUrl || "/placeholder-avatar.jpg"}
                              alt={provider.businessName}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white"
                            >
                              <Heart className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <Link href={`/provider/${provider.id}`}>
                              <h4 className="font-semibold text-gray-900 truncate">
                                {provider.businessName}
                              </h4>
                            </Link>
                            
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">
                                {provider.rating?.toFixed(1) || "5.0"} ({provider.reviewCount || 0})
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600 truncate">
                                {provider.location}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 mt-1">
                              <DollarSign className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                From ${provider.minPrice || "50"}
                              </span>
                              <Clock className="h-3 w-3 text-gray-400 ml-2" />
                              <span className="text-sm text-gray-600">
                                {provider.availableToday ? "Available today" : "Next available"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex space-x-2">
                                <Link href={`/booking/${provider.id}`}>
                                  <Button size="sm" className="text-xs px-3">
                                    Book Now
                                  </Button>
                                </Link>
                                <Button variant="outline" size="sm" className="p-2">
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm" className="p-2">
                                  <Phone className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or browse our featured providers.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Featured Providers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Featured Providers</h3>
              <div className="grid grid-cols-2 gap-3">
                {featuredProviders.slice(0, 4).map((provider: any) => (
                  <Card key={provider.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <img
                        src={provider.profileImageUrl || "/placeholder-avatar.jpg"}
                        alt={provider.businessName}
                        className="w-full h-24 rounded-lg object-cover mb-2"
                      />
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {provider.businessName}
                      </h4>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">
                          {provider.rating?.toFixed(1) || "5.0"}
                        </span>
                      </div>
                      <Link href={`/provider/${provider.id}`}>
                        <Button size="sm" className="w-full mt-2 text-xs">
                          View Profile
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Popular Services */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Popular Services</h3>
              <div className="grid grid-cols-2 gap-2">
                {popularServices.slice(0, 6).map((service: any) => (
                  <Button
                    key={service.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceSelect(service.name)}
                    className="h-auto py-3 px-4 flex-col space-y-1"
                  >
                    <span className="text-sm font-medium">{service.name}</span>
                    <span className="text-xs text-gray-500">
                      {service.providerCount} providers
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}