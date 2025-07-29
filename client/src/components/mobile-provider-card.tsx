import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Heart, Phone } from "lucide-react";
import { motion } from "framer-motion";

interface MobileProviderCardProps {
  provider: any;
  compact?: boolean;
}

export default function MobileProviderCard({ provider, compact = false }: MobileProviderCardProps) {
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link href={`/provider/${provider.id}`}>
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-[#F25D22] font-bold">
                    {provider.businessName?.charAt(0) || 'P'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {provider.businessName || 'Beauty Provider'}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                      <span>{provider.rating || '4.8'}</span>
                    </div>
                    <span>•</span>
                    <span>{provider.city || 'Local'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
        <CardContent className="p-0">
          {/* Provider Image/Avatar */}
          <div className="relative h-32 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[#F25D22] font-bold text-2xl">
                {provider.businessName?.charAt(0) || 'P'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Provider Info */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {provider.businessName || 'Beauty Provider'}
              </h3>
              <p className="text-sm text-gray-600">
                {provider.specialties?.join(", ") || "Full Beauty Services"}
              </p>
            </div>

            {/* Rating and Location */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-semibold text-sm">{provider.rating || '4.8'}</span>
                <span className="text-xs text-gray-500">({provider.reviewCount || '127'})</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{provider.city || 'Local'}</span>
              </div>
            </div>

            {/* Services and Pricing */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {(provider.services || []).slice(0, 3).map((service: any, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {service.name}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Starting from</span>
                <span className="font-bold text-[#F25D22]">
                  ${provider.startingPrice || '25'}
                </span>
              </div>
            </div>

            {/* Availability Indicator */}
            <div className="flex items-center space-x-2 text-xs">
              <Clock className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">Available Today</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Link href={`/booking/${provider.id}`} className="flex-1">
                <Button className="w-full bg-[#F25D22] hover:bg-[#E04A1A] text-white text-sm">
                  Book Now
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="px-3">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}