import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { AnimatePresence } from "framer-motion";
import { Repeat, Users, UserPlus, Clock, Calendar, Star, MapPin } from "lucide-react";
import RecurringBooking from "@/components/recurring-booking";
import WaitlistManager from "@/components/waitlist-manager";
import GroupBooking from "@/components/group-booking";

export default function AdvancedBooking() {
  const { providerId } = useParams();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { data: professional } = useQuery<any>({
    queryKey: ["/api/providers", parseInt(providerId as string)],
    enabled: !!providerId,
  });

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["/api/providers", parseInt(providerId as string), "services"],
    enabled: !!providerId,
  });

  const availableSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider not found</h1>
            <p className="text-gray-600">The provider you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-8">
        {/* Provider Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <img
                src={professional.profileImageUrl || "/placeholder-avatar.jpg"}
                alt={professional.businessName}
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {professional.businessName}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{professional.rating?.toFixed(1) || "5.0"}</span>
                    <span>({professional.reviewCount || 0} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{professional.location}</span>
                  </div>
                </div>
                <p className="text-gray-700">{professional.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Booking Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recurring Bookings */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => setActiveModal('recurring')}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Repeat className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Recurring Appointments</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Schedule regular appointments with automatic rebooking. Perfect for maintenance treatments.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge variant="outline">Weekly</Badge>
                <Badge variant="outline">Bi-weekly</Badge>
                <Badge variant="outline">Monthly</Badge>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Save 10% with recurring bookings
              </div>
            </CardContent>
          </Card>

          {/* Group Bookings */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveModal('group')}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Group Events</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Book for special events, parties, or group sessions. Up to 20 people.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge variant="outline">Birthday Parties</Badge>
                <Badge variant="outline">Weddings</Badge>
                <Badge variant="outline">Corporate Events</Badge>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Group discounts available
              </div>
            </CardContent>
          </Card>

          {/* Waitlist */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Waitlist Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WaitlistManager 
                professionalId={professional?.id || 0} 
                services={services || []}
                isProvider={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Service Selection for Modals */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service: any) => (
                  <div key={service.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{service.duration} min</Badge>
                        <span className="font-bold text-lg">${service.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'recurring' && (
          <RecurringBooking
            professionalId={professional?.id || 0}
            services={services || []}
            availableSlots={availableSlots}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'group' && (
          <GroupBooking
            professionalId={professional?.id || 0}
            services={services || []}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}