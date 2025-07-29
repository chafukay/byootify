import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/navigation";
import SearchBar from "@/components/search-bar";
import AdvancedSearch, { type SearchFilters } from "@/components/advanced-search";
import SearchMap from "@/components/search-map";
import ModernSearchResults from "@/components/modern-search-results";
import { 
  Filter, MapPin, Star, Clock, Verified, Grid, List, 
  Map, SlidersHorizontal, ArrowUpDown, Eye, Heart, Bookmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Professional } from "@shared/schema";

export default function Search() {
  const { t } = useTranslation();
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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<Professional | null>(null);
  const [sortBy, setSortBy] = useState("relevance");

  // Get search params from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setSearchFilters(prev => ({
      ...prev,
      location: urlParams.get("location") || "",
      category: urlParams.get("category") || "all",
    }));
  }, []);

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
          console.log("Location access denied, using default location");
        }
      );
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Search Header - Sticky */}
      <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchBar 
                defaultLocation={searchFilters.location}
                defaultService={searchFilters.category}
                compact={true}
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
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <AdvancedSearch 
                    filters={searchFilters}
                    onChange={handleSearchChange}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Layout */}
        <div className={`grid gap-6 ${showMap ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
          {/* Results Panel */}
          <div className={`${showMap ? 'lg:col-span-7' : 'col-span-1'}`}>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {searchFilters.location || searchFilters.category !== "all" ? 
                    "Search Results" : 
                    "Featured Providers"
                  }
                </h1>
                <p className="text-gray-600">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    `${professionals.length} provider${professionals.length !== 1 ? 's' : ''} found`
                  )}
                </p>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Best Match</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 px-3"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-7 px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded mb-3 w-2/3" />
                      <div className="flex gap-2 mb-3">
                        <div className="h-6 bg-gray-200 rounded-full w-16" />
                        <div className="h-6 bg-gray-200 rounded-full w-20" />
                      </div>
                      <div className="h-9 bg-gray-200 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results */}
            {!isLoading && (
              <ModernSearchResults
                providers={professionals}
                viewMode={viewMode}
                onProviderSelect={setSelectedProvider}
                selectedProvider={selectedProvider}
              />
            )}

            {/* No Results */}
            {!isLoading && professionals.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No providers found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or expanding your search area.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(true)}
                    className="mx-auto"
                  >
                    Adjust Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map Panel */}
          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:col-span-5"
              >
                <div className="sticky top-32">
                  <SearchMap
                    providers={professionals}
                    selectedProvider={selectedProvider}
                    onProviderSelect={setSelectedProvider}
                    className="h-[calc(100vh-10rem)]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}