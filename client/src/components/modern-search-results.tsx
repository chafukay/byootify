import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, MapPin, Clock, Heart, Verified, Share, 
  Bookmark, Phone, MessageCircle, Calendar,
  DollarSign, Award, Users, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Professional } from "@shared/schema";

interface ModernSearchResultsProps {
  providers: Professional[];
  viewMode: "grid" | "list";
  onProviderSelect?: (provider: Professional) => void;
  selectedProvider?: Professional | null;
}

export default function ModernSearchResults({ 
  providers, 
  viewMode, 
  onProviderSelect,
  selectedProvider 
}: ModernSearchResultsProps) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  const toggleFavorite = (providerId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(providerId)) {
        newFavorites.delete(providerId);
      } else {
        newFavorites.add(providerId);
      }
      return newFavorites;
    });
  };

  const toggleBookmark = (providerId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked(prev => {
      const newBookmarked = new Set(prev);
      if (newBookmarked.has(providerId)) {
        newBookmarked.delete(providerId);
      } else {
        newBookmarked.add(providerId);
      }
      return newBookmarked;
    });
  };

  const getPriceRange = (provider: Professional) => {
    // Mock price range based on rating and verification
    const rating = provider.rating ? parseFloat(provider.rating.toString()) : 0;
    if (rating >= 4.8) return "$$$-$$$$";
    if (rating >= 4.5) return "$$-$$$";
    return "$-$$";
  };

  const getResponseTime = () => {
    const times = ["Usually responds within 1 hour", "Usually responds within 2 hours", "Usually responds within 4 hours"];
    return times[Math.floor(Math.random() * times.length)];
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider, index) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <Card 
              className={`
                overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer
                border-0 shadow-md hover:shadow-2xl hover:-translate-y-1
                ${selectedProvider?.id === provider.id ? 'ring-2 ring-primary shadow-xl' : ''}
              `}
              onClick={() => onProviderSelect?.(provider)}
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={provider.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.businessName}`}
                  alt={provider.businessName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium">
                    Featured
                  </Badge>
                  {provider.isVerified && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium flex items-center gap-1">
                      <Verified className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                    onClick={(e) => toggleFavorite(provider.id, e)}
                  >
                    <Heart 
                      className={`w-4 h-4 ${favorites.has(provider.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                    onClick={(e) => toggleBookmark(provider.id, e)}
                  >
                    <Bookmark 
                      className={`w-4 h-4 ${bookmarked.has(provider.id) ? 'fill-blue-500 text-blue-500' : 'text-gray-600'}`} 
                    />
                  </Button>
                </div>

                {/* Distance Badge */}
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    2.3 mi
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Header */}
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors">
                      {provider.businessName || 'Provider'}
                    </h3>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-sm">{provider.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">({provider.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {provider.location || 'Location'}
                  </p>
                </div>

                {/* Specialties */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {provider.specialties?.slice(0, 3).map((specialty, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs px-2 py-1">
                        {specialty}
                      </Badge>
                    ))}
                    {provider.specialties && provider.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        +{provider.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price and Availability */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {getPriceRange(provider)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {getResponseTime()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href={`/provider/${provider.id}`} className="flex-1">
                    <Button className="w-full text-sm h-9">
                      View Profile
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="h-9 px-3">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4">
      {providers.map((provider, index) => (
        <motion.div
          key={provider.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className={`
              overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer
              border-0 shadow-sm hover:shadow-md
              ${selectedProvider?.id === provider.id ? 'ring-2 ring-primary shadow-lg' : ''}
            `}
            onClick={() => onProviderSelect?.(provider)}
          >
            <CardContent className="p-0">
              <div className="flex">
                {/* Image */}
                <div className="w-48 h-32 flex-shrink-0 relative overflow-hidden">
                  <img 
                    src={provider.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.businessName || 'Provider'}`}
                    alt={provider.businessName || 'Provider'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Distance Badge */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      2.3 mi
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-xl text-gray-900 hover:text-primary transition-colors">
                          {provider.businessName || 'Provider'}
                        </h3>
                        
                        <Badge className="bg-amber-500 text-white text-xs">Featured</Badge>
                        {provider.isVerified && (
                          <Badge className="bg-green-500 text-white text-xs flex items-center gap-1">
                            <Verified className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" />
                        {provider.location || 'Location'}
                      </p>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {provider.specialties?.slice(0, 4).map((specialty, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {provider.specialties && provider.specialties.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.specialties.length - 4} more
                          </Badge>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getResponseTime()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {provider.reviewCount || 0} clients
                        </span>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="text-right flex flex-col items-end gap-3">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-lg">{provider.rating}</span>
                        <span className="text-gray-500 text-sm">({provider.reviewCount || 0})</span>
                      </div>

                      {/* Price */}
                      <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                        {getPriceRange(provider)}
                      </Badge>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => toggleFavorite(provider.id, e)}
                          className="h-8 w-8 p-0"
                        >
                          <Heart 
                            className={`w-4 h-4 ${favorites.has(provider.id) ? 'fill-red-500 text-red-500' : ''}`} 
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => toggleBookmark(provider.id, e)}
                          className="h-8 w-8 p-0"
                        >
                          <Bookmark 
                            className={`w-4 h-4 ${bookmarked.has(provider.id) ? 'fill-blue-500 text-blue-500' : ''}`} 
                          />
                        </Button>
                        <Link href={`/provider/${provider.id}`}>
                          <Button size="sm" className="h-8">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}