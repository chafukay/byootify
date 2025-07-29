import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Scissors, Verified } from "lucide-react";
import { Link } from "wouter";
import type { Professional } from "@shared/schema";

interface ProfessionalCardProps {
  professional: Professional;
  compact?: boolean;
}

export default function ProfessionalCard({ professional, compact = false }: ProfessionalCardProps) {
  const displayName = professional.businessName || "Beauty Provider";
  
  const specialtiesText = professional.specialties?.join(" • ") || "Beauty Services";
  const rating = parseFloat(professional.rating || "0");
  const reviewCount = professional.reviewCount || 0;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
      {/* Professional Image/Avatar */}
      <div className={`${compact ? 'h-32' : 'h-48'} bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative`}>
        <Scissors className={`${compact ? 'h-12 w-12' : 'h-16 w-16'} text-primary/50`} />
        
        {professional.isVerified && (
          <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 border-green-200">
            <Verified className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>
      
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between mb-3">
          <h4 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 truncate`}>
            {displayName}
          </h4>
          {rating > 0 && (
            <div className="flex items-center space-x-1 text-accent">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <p className={`text-gray-600 mb-3 ${compact ? 'text-sm' : ''} truncate`}>
          {specialtiesText}
        </p>
        
        <div className="flex items-center text-gray-500 mb-4">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className={`${compact ? 'text-xs' : 'text-sm'} truncate`}>
            {professional.location}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
            <span className="font-medium">{reviewCount}</span> reviews
          </div>
          {professional.priceRange && (
            <div className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-primary`}>
              {professional.priceRange}
            </div>
          )}
        </div>
        
        {professional.bio && !compact && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {professional.bio}
          </p>
        )}
        
        <Link href={`/provider/${professional.id}`}>
          <Button className={`w-full ${compact ? 'text-sm py-2' : ''}`}>
            View Profile & Book
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
