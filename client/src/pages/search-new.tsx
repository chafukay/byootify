import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import SearchBar from "@/components/search-bar";
import MobileSearchBar from "@/components/mobile-search-bar";
import MobileProviderCard from "@/components/mobile-provider-card";
import AdvancedSearch, { type SearchFilters } from "@/components/advanced-search";
import SearchMap from "@/components/search-map";
import { useMobile } from "@/hooks/use-mobile";
import { 
  Filter, MapPin, Star, SlidersHorizontal, Verified, Grid, List, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Professional } from "@shared/schema";

export default function Search() {
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: "",
    category: "all",
    priceMin: 0,
    priceMax: 500,
    rating: 0,
    distance: 25,
    specialties: [],
    availability: "flexible",
    sortBy: "rating",
    isVerified: false,
    hasPortfolio: false,
    isInstantBooking: false,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Professional | null>(null);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showMap, setShowMap] = useState(false);

  // Get user's location for proximity sorting
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied, using default providers");
        }
      );
    }
  }, []);

  // Get search params from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setSearchFilters(prev => ({
      ...prev,
      location: urlParams.get("location") || "",
      category: urlParams.get("category") || "all",
    }));
  }, []);

  const { data: searchResults = [], isLoading } = useQuery<Professional[]>({
    queryKey: [
      "/api/providers/search?" + new URLSearchParams({
        ...(searchFilters.location && { location: searchFilters.location }),
        ...(searchFilters.category && searchFilters.category !== "all" && { category: searchFilters.category }),
        ...(searchFilters.priceMin && { priceMin: searchFilters.priceMin.toString() }),
        ...(searchFilters.priceMax && { priceMax: searchFilters.priceMax.toString() }),
        ...(searchFilters.rating && { rating: searchFilters.rating.toString() }),
        ...(searchFilters.distance && { distance: searchFilters.distance.toString() }),
        ...(searchFilters.sortBy && { sortBy: searchFilters.sortBy }),
        ...(searchFilters.specialties.length > 0 && { specialties: searchFilters.specialties.join(',') }),
        ...(searchFilters.availability !== "flexible" && { availability: searchFilters.availability }),
        ...(searchFilters.isVerified && { verified: "true" }),
        ...(searchFilters.hasPortfolio && { portfolio: "true" }),
        ...(searchFilters.isInstantBooking && { instant: "true" }),
      }).toString()
    ],
    enabled: !!searchFilters.location || (!!searchFilters.category && searchFilters.category !== "all"),
  });

  // Get nearby providers when no search is initiated (sorted by proximity)
  const { data: nearbyProviders = [] } = useQuery<Professional[]>({
    queryKey: ["/api/providers/nearby", userLocation?.lat, userLocation?.lng],
    enabled: !searchFilters.location && (!searchFilters.category || searchFilters.category === "all") && !!userLocation,
  });

  const { data: featuredProviders = [] } = useQuery<Professional[]>({
    queryKey: ["/api/providers/featured"],
    enabled: !searchFilters.location && (!searchFilters.category || searchFilters.category === "all") && !userLocation,
  });

  const professionals = searchResults.length > 0 ? searchResults : nearbyProviders.length > 0 ? nearbyProviders : featuredProviders;

  const handleSearchChange = (newFilters: SearchFilters) => {
    setSearchFilters(newFilters);
    
    // Update URL
    const urlParams = new URLSearchParams();
    if (newFilters.location) urlParams.set("location", newFilters.location);
    if (newFilters.category && newFilters.category !== "all") urlParams.set("category", newFilters.category);
    window.history.replaceState({}, "", `/search?${urlParams.toString()}`);
  };

  const activeFiltersCount = Object.entries(searchFilters).filter(([key, value]) => {
    if (key === 'location' && value) return true;
    if (key === 'category' && value !== 'all') return true;
    if (key === 'priceMin' && value > 0) return true;
    if (key === 'priceMax' && value < 500) return true;
    if (key === 'rating' && value > 0) return true;
    if (key === 'distance' && value !== 25) return true;
    if (key === 'specialties' && Array.isArray(value) && value.length > 0) return true;
    if (key === 'availability' && value !== 'flexible') return true;
    if (key === 'sortBy' && value !== 'rating') return true;
    if (typeof value === 'boolean' && value) return true;
    return false;
  }).length;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Mobile Search Header */}
        <div className="pt-20 pb-4 px-4 bg-white shadow-sm">
          <MobileSearchBar 
            defaultLocation={searchFilters.location} 
            defaultService={searchFilters.category}
            onSearchChange={(location, service) => {
              setSearchFilters(prev => ({
                ...prev,
                location,
                category: service || "all"
              }));
            }}
          />
        </div>

        {/* Mobile Filters and Sort */}
        <div className="px-4 py-3 bg-white border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-[#F25D22] text-white">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevant</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="distance">Nearest</SelectItem>
                <SelectItem value="price-low">Price: Low</SelectItem>
                <SelectItem value="price-high">Price: High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={showMap ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMap(!showMap)}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b px-4 py-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AdvancedSearch
                filters={searchFilters}
                onChange={setSearchFilters}
                compact={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Map View */}
        {showMap && (
          <div className="h-64 bg-gray-200">
            <SearchMap
              providers={professionals}
              onProviderSelect={setSelectedProvider}
              selectedProvider={selectedProvider}
              userLocation={userLocation}
            />
          </div>
        )}

        {/* Mobile Results */}
        <div className="px-4 py-4 space-y-4 pb-20">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No providers found matching your criteria</p>
              <Button
                className="mt-4"
                onClick={() => setSearchFilters({
                  location: "",
                  category: "all",
                  priceMin: 0,
                  priceMax: 500,
                  rating: 0,
                  distance: 25,
                  specialties: [],
                  availability: "flexible",
                  sortBy: "rating",
                  isVerified: false,
                  hasPortfolio: false,
                  isInstantBooking: false,
                })}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
              {professionals.map((provider) => (
                <MobileProviderCard
                  key={provider.id}
                  provider={provider}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Search Header - Sticky */}
      <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchBar 
                defaultLocation={searchFilters.location}
                defaultService={searchFilters.category}
                compact={false}
                onSearchChange={(location, service) => {
                  handleSearchChange({
                    ...searchFilters,
                    location: location || "",
                    category: service || "all"
                  });
                }}
              />
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-primary text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters Row */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg shadow-sm border p-6 mb-6"
            >
              <AdvancedSearch 
                onSearchChange={handleSearchChange}
                defaultFilters={searchFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content - 50/50 Split: Results Left, Map Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-20rem)]">
          {/* Results Panel - Left Side (50%) */}
          <div className="overflow-y-auto pr-4">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-2 z-10">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {searchFilters.location || searchFilters.category !== "all" 
                    ? `${professionals.length} providers found`
                    : nearbyProviders.length > 0 
                      ? `Providers Near You`
                      : `Featured Providers`
                  }
                </h1>
                
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-secondary text-white">
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                  </Badge>
                )}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                // Loading skeleton in row format
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : professionals.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="max-w-md mx-auto">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No providers found
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Try adjusting your search criteria or enable location access to find providers near you.
                      </p>
                      <Button onClick={() => handleSearchChange({
                        location: "",
                        category: "all",
                        priceMin: 0,
                        priceMax: 500,
                        rating: 0,
                        distance: 25,
                        specialties: [],
                        availability: "flexible",
                        sortBy: "rating",
                        isVerified: false,
                        hasPortfolio: false,
                        isInstantBooking: false,
                      })}>
                        Clear All Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Provider results in row format
                <div className="space-y-4">
                  {professionals.map((professional, index) => (
                    <motion.div
                      key={professional.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer border border-gray-100 hover:border-primary/20"
                      onClick={() => setSelectedProvider(professional)}
                    >
                      <div className="flex gap-4">
                        {/* Provider Image */}
                        <div className="w-28 h-20 flex-shrink-0 relative overflow-hidden rounded-lg bg-gray-100">
                          <img 
                            src={professional.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${professional.businessName || 'Provider'}`}
                            alt={professional.businessName || 'Provider'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Provider Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {professional.businessName || 'Provider'}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {professional.location || 'Location'}
                              </p>
                            </div>
                            
                            <div className="text-right flex flex-col items-end">
                              <div className="flex items-center gap-1 mb-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="font-medium text-sm">{professional.rating || '4.5'}</span>
                                <span className="text-xs text-gray-500">({professional.reviewCount || 0})</span>
                              </div>
                              {professional.isVerified && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  <Verified className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                            {professional.bio || 'Professional beauty service provider offering quality services.'}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {(professional.specialties || ['Hair', 'Nails']).slice(0, 3).map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm font-medium text-primary">
                                Starting at $50
                              </p>
                              <p className="text-xs text-gray-500">
                                Available today
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map Panel - Right Side (50%) */}
          <div className="sticky top-0 h-full">
            <div className="h-full rounded-lg shadow-sm border border-gray-200 bg-white overflow-hidden">
              <SearchMap
                providers={professionals.map(p => ({
                  id: p.id,
                  businessName: p.businessName || 'Provider',
                  location: p.location || 'Location',
                  rating: parseFloat(p.rating || '4.5'),
                  reviewCount: p.reviewCount || 0,
                  priceRange: '$50-$150',
                  specialties: p.specialties || ['Hair', 'Nails'],
                  profileImageUrl: p.profilePicture,
                  verified: p.isVerified || false,
                  featured: false,
                  coordinates: {
                    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.1
                  }
                }))}
                selectedProvider={selectedProvider ? {
                  id: selectedProvider.id,
                  businessName: selectedProvider.businessName || 'Provider',
                  location: selectedProvider.location || 'Location',
                  rating: parseFloat(selectedProvider.rating || '4.5'),
                  reviewCount: selectedProvider.reviewCount || 0,
                  priceRange: '$50-$150',
                  specialties: selectedProvider.specialties || ['Hair', 'Nails'],
                  profileImageUrl: selectedProvider.profilePicture,
                  verified: selectedProvider.isVerified || false,
                  featured: false,
                  coordinates: {
                    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
                    lng: -74.0060 + (Math.random() - 0.5) * 0.1
                  }
                } : null}
                onProviderSelect={(provider) => {
                  const originalProvider = professionals.find(p => p.id === provider.id);
                  if (originalProvider) {
                    setSelectedProvider(originalProvider);
                  }
                }}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}