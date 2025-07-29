import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/navigation";
import MobileBooking from "@/components/mobile-booking";
import BookingCalendar from "@/components/booking-calendar";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Professional, Service, Availability } from "@shared/schema";
import { 
  Calendar, Clock, DollarSign, User, MapPin, 
  CheckCircle, AlertCircle, ArrowLeft, CreditCard 
} from "lucide-react";

export default function Booking() {
  const { providerId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isMobile } = useMobile();
  const { toast } = useToast();

  // Mobile Layout
  if (isMobile && providerId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <MobileBooking providerId={providerId} />
      </div>
    );
  }

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1); // 1: Services, 2: Date/Time, 3: Confirm

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book an appointment.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: professional, isLoading: professionalLoading } = useQuery<Professional>({
    queryKey: ["/api/providers", parseInt(providerId as string)],
    enabled: !!providerId,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/providers", parseInt(providerId as string), "services"],
    enabled: !!providerId,
  });

  const { data: availability = [] } = useQuery<Availability[]>({
    queryKey: ["/api/providers", parseInt(providerId as string), "availability"],
    enabled: !!providerId,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Created",
        description: "Your appointment has been scheduled successfully!",
      });
      setLocation(`/checkout/${booking.id}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Booking Failed",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || professionalLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h2>
              <p className="text-gray-600 mb-6">The provider you're trying to book with doesn't exist.</p>
              <Button onClick={() => setLocation("/search")}>
                Browse Providers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = professional.businessName || "Beauty Provider";

  const selectedServicesData = services.filter((service: Service) => 
    selectedServices.includes(service.id)
  );

  const totalPrice = selectedServicesData.reduce((sum: number, service: Service) => 
    sum + parseFloat(service.price), 0
  );

  const totalDuration = selectedServicesData.reduce((sum: number, service: Service) => 
    sum + service.duration, 0
  );

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    const appointmentDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes);

    createBookingMutation.mutate({
      professionalId: parseInt(providerId as string),
      serviceIds: selectedServices,
      appointmentDate: appointmentDateTime.toISOString(),
      totalPrice,
      notes: notes.trim() || null,
    });
  };

  const canProceedToStep2 = selectedServices.length > 0;
  const canProceedToStep3 = canProceedToStep2 && selectedDate && selectedTime;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/provider/${providerId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
              <p className="text-gray-600">with {displayName}</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className={step >= 1 ? 'text-primary font-medium' : 'text-gray-600'}>
                  Select Services
                </span>
              </div>
              
              <div className="flex-1 mx-4 h-px bg-gray-200"></div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className={step >= 2 ? 'text-primary font-medium' : 'text-gray-600'}>
                  Date & Time
                </span>
              </div>
              
              <div className="flex-1 mx-4 h-px bg-gray-200"></div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className={step >= 3 ? 'text-primary font-medium' : 'text-gray-600'}>
                  Confirm
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Services */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Select Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {services.length > 0 ? (
                    <div className="space-y-4">
                      {services.map((service: Service) => (
                        <div 
                          key={service.id} 
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedServices.includes(service.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleServiceToggle(service.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <Checkbox 
                                checked={selectedServices.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                {service.description && (
                                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2">
                                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    <span>{service.duration} min</span>
                                  </div>
                                  <Badge variant="outline">{service.category}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-primary">${service.price}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No services available.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Select Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingCalendar
                    availability={availability}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onDateSelect={setSelectedDate}
                    onTimeSelect={setSelectedTime}
                    duration={totalDuration}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Confirm Booking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Professional Info */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{displayName}</h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {professional.businessAddress || professional.city || "Location TBD"}
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Appointment Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">Date</span>
                        </div>
                        <p className="text-gray-900">
                          {selectedDate?.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">Time</span>
                        </div>
                        <p className="text-gray-900">{selectedTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Services */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Selected Services</h4>
                    <div className="space-y-3">
                      {selectedServicesData.map((service: Service) => (
                        <div key={service.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.duration} minutes</p>
                          </div>
                          <p className="font-semibold text-primary">${service.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Special Requests (Optional)
                    </label>
                    <Textarea
                      placeholder="Any special requests or notes for your appointment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServicesData.length > 0 && (
                  <>
                    <div className="space-y-2">
                      {selectedServicesData.map((service: Service) => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span>{service.name}</span>
                          <span>${service.price}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Duration</span>
                        <span>{totalDuration} min</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total Price</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Separator />
                  </>
                )}

                {selectedDate && selectedTime && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Date</span>
                      <span>{selectedDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span>{selectedTime}</span>
                    </div>
                  </div>
                )}

                {/* Step Navigation */}
                <div className="space-y-3 pt-4">
                  {step === 1 && (
                    <Button 
                      className="w-full"
                      disabled={!canProceedToStep2}
                      onClick={() => setStep(2)}
                    >
                      Continue to Date & Time
                    </Button>
                  )}
                  
                  {step === 2 && (
                    <>
                      <Button 
                        className="w-full"
                        disabled={!canProceedToStep3}
                        onClick={() => setStep(3)}
                      >
                        Continue to Confirm
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setStep(1)}
                      >
                        Back to Services
                      </Button>
                    </>
                  )}
                  
                  {step === 3 && (
                    <>
                      <Button 
                        className="w-full gradient-primary"
                        onClick={handleConfirmBooking}
                        disabled={createBookingMutation.isPending}
                      >
                        {createBookingMutation.isPending ? (
                          "Creating Booking..."
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Confirm & Pay
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setStep(2)}
                        disabled={createBookingMutation.isPending}
                      >
                        Back to Date & Time
                      </Button>
                    </>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
