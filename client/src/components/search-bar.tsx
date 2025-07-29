import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface SearchBarProps {
  defaultLocation?: string;
  defaultService?: string;
  defaultDate?: string;
  compact?: boolean;
  onSearchChange?: (location: string, service: string) => void;
}

export default function SearchBar({ 
  defaultLocation = "", 
  defaultService = "", 
  defaultDate = "",
  compact = false,
  onSearchChange
}: SearchBarProps) {
  const [, setLocation] = useLocation();
  const [searchLocation, setSearchLocation] = useState(defaultLocation);
  const [selectedService, setSelectedService] = useState(defaultService);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  const handleSearch = () => {
    // If onSearchChange is provided, use it (for controlled search)
    if (onSearchChange) {
      onSearchChange(searchLocation, selectedService);
      return;
    }
    
    // Otherwise, navigate to search page (for uncontrolled search)
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (selectedService) params.set("category", selectedService);
    if (selectedDate) params.set("date", selectedDate);
    
    setLocation(`/search?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <Input
          placeholder="Enter location"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hair">Hair Styling</SelectItem>
            <SelectItem value="braiding">Hair Braiding</SelectItem>
            <SelectItem value="nails">Nail Services</SelectItem>
            <SelectItem value="makeup">Makeup</SelectItem>
            <SelectItem value="barbering">Barbering</SelectItem>
            <SelectItem value="skincare">Skincare</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} className="bg-secondary hover:bg-secondary/90">
          Search
        </Button>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hair">Hair Styling</SelectItem>
                <SelectItem value="braiding">Hair Braiding</SelectItem>
                <SelectItem value="nails">Nail Services</SelectItem>
                <SelectItem value="makeup">Makeup</SelectItem>
                <SelectItem value="barbering">Barbering</SelectItem>
                <SelectItem value="skincare">Esthetics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <Input
              placeholder="Enter city or zip code"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleSearch}
              className="w-full bg-secondary hover:bg-secondary/90 text-white"
            >
              Search Professionals
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
