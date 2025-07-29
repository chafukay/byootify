import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Search, MapPin, Calendar } from "lucide-react";

interface MobileSearchBarProps {
  defaultLocation?: string;
  defaultService?: string;
  onSearchChange?: (location: string, service: string) => void;
}

export default function MobileSearchBar({ 
  defaultLocation = "", 
  defaultService = "", 
  onSearchChange
}: MobileSearchBarProps) {
  const [, setLocation] = useLocation();
  const [searchLocation, setSearchLocation] = useState(defaultLocation);
  const [selectedService, setSelectedService] = useState(defaultService);

  const handleSearch = () => {
    if (onSearchChange) {
      onSearchChange(searchLocation, selectedService);
      return;
    }
    
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (selectedService) params.set("category", selectedService);
    
    setLocation(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg space-y-3">
      {/* Location Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Where do you want beauty services?"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          className="pl-10 py-3 text-base border-gray-300 rounded-xl"
        />
      </div>

      {/* Service Selection */}
      <Select value={selectedService} onValueChange={setSelectedService}>
        <SelectTrigger className="py-3 text-base border-gray-300 rounded-xl">
          <SelectValue placeholder="What service do you need?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hair">Hair Styling</SelectItem>
          <SelectItem value="braiding">Hair Braiding</SelectItem>
          <SelectItem value="nails">Nail Services</SelectItem>
          <SelectItem value="makeup">Makeup</SelectItem>
          <SelectItem value="barbering">Barbering</SelectItem>
          <SelectItem value="skincare">Skincare</SelectItem>
          <SelectItem value="spa">Spa Services</SelectItem>
          <SelectItem value="extensions">Hair Extensions</SelectItem>
        </SelectContent>
      </Select>

      {/* Search Button */}
      <Button 
        onClick={handleSearch} 
        className="w-full bg-[#F25D22] hover:bg-[#E04A1A] text-white py-3 text-base font-semibold rounded-xl"
      >
        <Search className="h-5 w-5 mr-2" />
        Find Beauty Providers
      </Button>
    </div>
  );
}