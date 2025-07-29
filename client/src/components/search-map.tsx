import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, DollarSign, Clock, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different provider types
const createCustomIcon = (color: string, size: number = 25) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size]
  });
};

const featuredIcon = createCustomIcon('#f59e0b', 30);
const verifiedIcon = createCustomIcon('#10b981', 25);
const selectedIcon = createCustomIcon('#3b82f6', 35);
const defaultIcon = createCustomIcon('#6b7280', 25);

interface Provider {
  id: number;
  businessName: string;
  location: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  specialties: string[];
  profileImageUrl?: string;
  distance?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  featured?: boolean;
  verified?: boolean;
}

interface SearchMapProps {
  providers: Provider[];
  selectedProvider?: Provider | null;
  onProviderSelect: (provider: Provider) => void;
  className?: string;
}

export default function SearchMap({ providers, selectedProvider, onProviderSelect, className }: SearchMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 39.7392, lng: -104.9903 }); // Default to Denver (center of our provider locations)
  const [hoveredProvider, setHoveredProvider] = useState<Provider | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Use real coordinates from providers or calculate from location data
  const mapMarkers = providers.map((provider, index) => ({
    ...provider,
    coordinates: provider.coordinates || getCoordinatesFromLocation(provider.location)
  }));

  // Function to get coordinates based on location string
  function getCoordinatesFromLocation(location: string): { lat: number; lng: number } {
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      "Chicago": { lat: 41.8781, lng: -87.6298 },
      "Denver": { lat: 39.7392, lng: -104.9903 },
      "Houston": { lat: 29.7604, lng: -95.3698 },
      "St. Louis": { lat: 38.6270, lng: -90.1994 },
      "Palatine": { lat: 42.1103, lng: -88.0342 },
      "Erie": { lat: 40.0503, lng: -105.0497 },
      "Denton": { lat: 33.2148, lng: -97.1331 },
      "Frankfort": { lat: 41.4961, lng: -87.8467 },
      "Zimmerman": { lat: 45.4425, lng: -93.5941 }
    };
    
    const city = Object.keys(cityCoordinates).find(c => location.includes(c));
    if (city) {
      const coords = cityCoordinates[city];
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01
      };
    }
    
    // Default to Denver area with slight variation
    return {
      lat: 39.7392 + (Math.random() - 0.5) * 0.1,
      lng: -104.9903 + (Math.random() - 0.5) * 0.1
    };
  }

  const getMarkerIcon = (provider: Provider) => {
    if (selectedProvider?.id === provider.id) return selectedIcon;
    if (provider.featured) return featuredIcon;
    if (provider.verified) return verifiedIcon;
    return defaultIcon;
  };

  return (
    <div className={`relative ${className}`}>
      <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'h-96'}`}>
        <CardContent className="p-0 relative h-full">
          {/* Real Interactive Map */}
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Provider Markers */}
            {mapMarkers.map((provider) => (
              <Marker
                key={provider.id}
                position={[provider.coordinates!.lat, provider.coordinates!.lng]}
                icon={getMarkerIcon(provider)}
                eventHandlers={{
                  click: () => onProviderSelect(provider),
                  mouseover: () => setHoveredProvider(provider),
                  mouseout: () => setHoveredProvider(null)
                }}
              >
                <Popup>
                  <div className="w-64 p-2">
                    <div className="flex items-start gap-3">
                      {provider.profileImageUrl && (
                        <img 
                          src={provider.profileImageUrl} 
                          alt={provider.businessName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {provider.businessName}
                        </h3>
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{provider.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({provider.reviewCount})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {provider.location}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {provider.specialties.slice(0, 2).map((specialty, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">
                            {provider.priceRange}
                          </span>
                          <Button
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => onProviderSelect(provider)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-8 h-8 p-0 bg-white/90 backdrop-blur-sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-xs font-semibold mb-2">Providers ({providers.length})</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Featured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span>Standard</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}