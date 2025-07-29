import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, User, CreditCard, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MobileBookingProps {
  providerId: string;
}

export default function MobileBooking({ providerId }: MobileBookingProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1);

  const { data: provider } = useQuery({
    queryKey: [`/api/providers/${providerId}`],
  });

  const { data: services = [] } = useQuery({
    queryKey: [`/api/providers/${providerId}/services`],
  });

  const { data: availability = [] } = useQuery({
    queryKey: [`/api/providers/${providerId}/availability`],
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: (data) => {
      toast({ title: "Booking confirmed!" });
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: () => {
      toast({ title: "Booking failed", variant: "destructive" });
    },
  });

  const totalPrice = selectedServices.reduce((total, serviceId) => {
    const service = services.find((s: any) => s.id === serviceId);
    return total + (service?.price || 0);
  }, 0);

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || selectedServices.length === 0) {
      toast({ title: "Please complete all required fields", variant: "destructive" });
      return;
    }

    createBookingMutation.mutate({
      providerId,
      serviceIds: selectedServices,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      notes,
    });
  };

  if (step === 4) {
    return (
      <div className="pt-20 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">Your appointment has been successfully booked.</p>
          <Button 
            onClick={() => window.location.href = "/bookings"}
            className="bg-[#F25D22] hover:bg-[#E04A1A]"
          >
            View My Bookings
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 px-4 space-y-6">
      {/* Progress Bar */}
      <div className="flex justify-center space-x-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i <= step ? 'bg-[#F25D22]' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Provider Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <span className="text-[#F25D22] font-bold text-xl">
                {provider?.businessName?.charAt(0) || 'P'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {provider?.businessName || 'Beauty Provider'}
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{provider?.city || 'Local'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Services */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">Select Services</h3>
          {services.map((service: any) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all ${
                selectedServices.includes(service.id) 
                  ? 'ring-2 ring-[#F25D22] bg-orange-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleServiceToggle(service.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{service.duration} min</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#F25D22]">${service.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button
            onClick={() => setStep(2)}
            disabled={selectedServices.length === 0}
            className="w-full bg-[#F25D22] hover:bg-[#E04A1A] mt-6"
          >
            Continue to Date & Time
          </Button>
        </motion.div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">Choose Date & Time</h3>
          
          {/* Date Selection */}
          <div className="grid grid-cols-3 gap-2">
            {['Today', 'Tomorrow', 'Wed 7/31'].map((date, index) => (
              <Button
                key={date}
                variant={selectedDate === date ? "default" : "outline"}
                onClick={() => setSelectedDate(date)}
                className="p-3 h-auto flex-col"
              >
                <span className="text-xs">{date}</span>
                <span className="text-lg font-bold">
                  {index === 0 ? '29' : index === 1 ? '30' : '31'}
                </span>
              </Button>
            ))}
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Available Times</h4>
            <div className="grid grid-cols-3 gap-2">
              {['9:00 AM', '10:30 AM', '12:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'].map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => setSelectedTime(time)}
                  size="sm"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedTime}
              className="flex-1 bg-[#F25D22] hover:bg-[#E04A1A]"
            >
              Continue
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">Review Booking</h3>
          
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="border-t pt-3">
                <div className="text-sm text-gray-600 mb-2">Services:</div>
                {selectedServices.map(serviceId => {
                  const service = services.find((s: any) => s.id === serviceId);
                  return (
                    <div key={serviceId} className="flex justify-between text-sm">
                      <span>{service?.name}</span>
                      <span>${service?.price}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#F25D22]">${totalPrice}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests (Optional)
            </label>
            <Textarea
              placeholder="Any special requests or notes for your provider..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleBooking}
              disabled={createBookingMutation.isPending}
              className="flex-1 bg-[#F25D22] hover:bg-[#E04A1A]"
            >
              {createBookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}