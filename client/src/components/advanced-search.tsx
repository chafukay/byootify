import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Star, Clock, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdvancedSearchProps {
  onSearchChange: (filters: SearchFilters) => void;
  defaultFilters?: Partial<SearchFilters>;
}

export interface SearchFilters {
  location: string;
  category: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  distance: number;
  specialties: string[];
  availability: string; // "today", "tomorrow", "this-week", "flexible"
  sortBy: string;
  isVerified: boolean;
  hasPortfolio: boolean;
  isInstantBooking: boolean;
}

const serviceCategories = [
  { value: "all", label: "All Services" },
  { value: "hair", label: "Hair Styling" },
  { value: "braiding", label: "Hair Braiding" },
  { value: "nails", label: "Nail Services" },
  { value: "makeup", label: "Makeup & Beauty" },
  { value: "barbering", label: "Barbering" },
  { value: "skincare", label: "Skincare & Facial" },
  { value: "massage", label: "Massage Therapy" },
  { value: "eyebrows", label: "Eyebrow Services" },
  { value: "extensions", label: "Hair Extensions" },
];

const specialtyOptions = [
  "Natural Hair", "Bridal Makeup", "Special Occasions", "Color Specialist",
  "Curl Specialist", "Beard Grooming", "Acrylic Nails", "Gel Nails",
  "Microblading", "Lash Extensions", "Anti-Aging", "Acne Treatment"
];

const sortOptions = [
  { value: "rating", label: "Highest Rated" },
  { value: "distance", label: "Nearest to Me" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "reviews", label: "Most Reviews" },
  { value: "newest", label: "Newest Providers" },
];

export default function AdvancedSearch({ onSearchChange, defaultFilters }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
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
    ...defaultFilters,
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    quality: true,
    preferences: false,
  });

  // Get popular specialties based on current category
  const { data: popularSpecialties = [] } = useQuery({
    queryKey: ["/api/specialties/popular", filters.category],
    enabled: filters.category !== "all",
  });

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onSearchChange(updatedFilters);
  };

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = filters.specialties.includes(specialty)
      ? filters.specialties.filter(s => s !== specialty)
      : [...filters.specialties, specialty];
    updateFilters({ specialties: newSpecialties });
  };

  const clearAllFilters = () => {
    const clearedFilters = {
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
    };
    setFilters(clearedFilters);
    onSearchChange(clearedFilters);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (typeof value === 'string') return value !== '' && value !== 'all' && value !== 'flexible' && value !== 'rating';
    if (typeof value === 'number') return value > 0 && value !== 25 && value !== 500;
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  }).length;

  return (
    <Card className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-secondary text-white">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Search Section */}
        <div>
          <button
            onClick={() => toggleSection('basic')}
            className="flex items-center justify-between w-full text-left font-medium text-sm text-gray-900 mb-3"
          >
            <span>Location & Service</span>
            {expandedSections.basic ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.basic && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Location */}
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Enter city, zip code, or address"
                      value={filters.location}
                      onChange={(e) => updateFilters({ location: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Service Category */}
                <div>
                  <Label className="text-sm font-medium">Service Category</Label>
                  <Select 
                    value={filters.category} 
                    onValueChange={(value) => updateFilters({ category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distance */}
                <div>
                  <Label className="text-sm font-medium">
                    Search Radius: {filters.distance} miles
                  </Label>
                  <Slider
                    value={[filters.distance]}
                    onValueChange={([value]) => updateFilters({ distance: value })}
                    max={100}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 mile</span>
                    <span>100+ miles</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Pricing Section */}
        <div>
          <button
            onClick={() => toggleSection('pricing')}
            className="flex items-center justify-between w-full text-left font-medium text-sm text-gray-900 mb-3"
          >
            <span>Price Range</span>
            {expandedSections.pricing ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.pricing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-sm font-medium">
                    Budget: ${filters.priceMin} - ${filters.priceMax === 500 ? '500+' : filters.priceMax}
                  </Label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label className="text-xs text-gray-500">Minimum: ${filters.priceMin}</Label>
                      <Slider
                        value={[filters.priceMin]}
                        onValueChange={([value]) => updateFilters({ priceMin: value })}
                        max={500}
                        step={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Maximum: ${filters.priceMax}</Label>
                      <Slider
                        value={[filters.priceMax]}
                        onValueChange={([value]) => updateFilters({ priceMax: value })}
                        max={500}
                        step={5}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Quality & Rating Section */}
        <div>
          <button
            onClick={() => toggleSection('quality')}
            className="flex items-center justify-between w-full text-left font-medium text-sm text-gray-900 mb-3"
          >
            <span>Quality & Reviews</span>
            {expandedSections.quality ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.quality && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Minimum Rating */}
                <div>
                  <Label className="text-sm font-medium">Minimum Rating</Label>
                  <RadioGroup
                    value={filters.rating.toString()}
                    onValueChange={(value) => updateFilters({ rating: parseInt(value) })}
                    className="flex flex-wrap gap-2 mt-2"
                  >
                    {[0, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                        <Label htmlFor={`rating-${rating}`} className="text-sm flex items-center gap-1">
                          {rating === 0 ? (
                            "Any rating"
                          ) : (
                            <>
                              {rating}+ <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            </>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Quality Filters */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={filters.isVerified}
                      onCheckedChange={(checked) => updateFilters({ isVerified: !!checked })}
                    />
                    <Label htmlFor="verified" className="text-sm">Verified providers only</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="portfolio"
                      checked={filters.hasPortfolio}
                      onCheckedChange={(checked) => updateFilters({ hasPortfolio: !!checked })}
                    />
                    <Label htmlFor="portfolio" className="text-sm">Has portfolio/photos</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="instant"
                      checked={filters.isInstantBooking}
                      onCheckedChange={(checked) => updateFilters({ isInstantBooking: !!checked })}
                    />
                    <Label htmlFor="instant" className="text-sm">Instant booking available</Label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Preferences Section */}
        <div>
          <button
            onClick={() => toggleSection('preferences')}
            className="flex items-center justify-between w-full text-left font-medium text-sm text-gray-900 mb-3"
          >
            <span>Specialties & Availability</span>
            {expandedSections.preferences ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.preferences && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Specialties */}
                <div>
                  <Label className="text-sm font-medium">Specialties</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specialtyOptions.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={filters.specialties.includes(specialty) ? "default" : "outline"}
                        className={`cursor-pointer text-xs ${
                          filters.specialties.includes(specialty)
                            ? "bg-secondary text-white"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => toggleSpecialty(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <Label className="text-sm font-medium">Availability</Label>
                  <Select 
                    value={filters.availability} 
                    onValueChange={(value) => updateFilters({ availability: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flexible">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Flexible dates
                        </div>
                      </SelectItem>
                      <SelectItem value="today">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Available today
                        </div>
                      </SelectItem>
                      <SelectItem value="tomorrow">Available tomorrow</SelectItem>
                      <SelectItem value="this-week">Available this week</SelectItem>
                      <SelectItem value="weekend">Weekend availability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-sm font-medium">Sort Results By</Label>
                  <Select 
                    value={filters.sortBy} 
                    onValueChange={(value) => updateFilters({ sortBy: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear Filters Button */}
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={clearAllFilters}
            disabled={activeFiltersCount === 0}
          >
            Clear All Filters ({activeFiltersCount})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}