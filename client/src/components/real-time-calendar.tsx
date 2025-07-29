import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar as CalendarIcon, Clock, User, AlertTriangle, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, isPast, isWithinInterval } from "date-fns";

interface RealTimeCalendarProps {
  providerId: number;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onTimeSelect?: (time: string) => void;
  serviceId?: number;
  serviceDuration?: number; // in minutes
}

interface TimeSlot {
  time: string;
  available: boolean;
  conflictReason?: string;
  bookingId?: string;
  clientName?: string;
}

interface AvailabilityData {
  date: string;
  slots: TimeSlot[];
  isBlocked: boolean;
  blockReason?: string;
}

export default function RealTimeCalendar({
  providerId,
  selectedDate = new Date(),
  onDateSelect,
  onTimeSelect,
  serviceId,
  serviceDuration = 60
}: RealTimeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [weekView, setWeekView] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch provider availability for the current month
  const { data: availability = [], isLoading } = useQuery<AvailabilityData[]>({
    queryKey: ["/api/providers", providerId, "availability", format(currentDate, "yyyy-MM")],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Fetch provider booking conflicts
  const { data: conflicts = [] } = useQuery({
    queryKey: ["/api/providers", providerId, "conflicts", format(currentDate, "yyyy-MM-dd")],
    enabled: !!selectedDate,
    refetchInterval: 15000, // More frequent updates for conflict detection
  });

  // Create booking mutation with conflict prevention
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings/validate-and-create", bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Confirmed",
        description: `Your appointment is scheduled for ${format(currentDate, "MMMM d, yyyy")} at ${selectedTime}`,
      });
      
      // Invalidate and refetch availability data
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "availability"]
      });
      
      // Reset selection
      setSelectedTime("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book an appointment",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return;
      }

      toast({
        title: "Booking Failed",
        description: error.message || "There was a conflict with your selected time. Please choose another slot.",
        variant: "destructive",
      });
    },
  });

  // Get availability for selected date
  const selectedDateAvailability = availability.find(day => 
    isSameDay(new Date(day.date), currentDate)
  );

  // Generate time slots (9 AM to 6 PM in 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break; // Don't go past 5:30 PM
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = format(new Date(2000, 0, 1, hour, minute), "h:mm a");
        
        // Check if this slot conflicts with existing bookings
        const slotData = selectedDateAvailability?.slots?.find(s => s.time === timeString);
        
        slots.push({
          time: timeString,
          displayTime,
          available: slotData?.available !== false && !isPast(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, minute)),
          conflictReason: slotData?.conflictReason,
          bookingId: slotData?.bookingId,
          clientName: slotData?.clientName,
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setSelectedTime(""); // Reset time selection
    onDateSelect?.(date);
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onTimeSelect?.(time);
  };

  // Check for booking conflicts in real-time
  const hasConflicts = (time: string) => {
    const slot = timeSlots.find(s => s.time === time);
    return slot && (!slot.available || slot.conflictReason);
  };

  // Quick book function
  const handleQuickBook = async () => {
    if (!selectedTime || !serviceId) {
      toast({
        title: "Missing Information",
        description: "Please select a time slot and service",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      providerId,
      serviceId,
      date: format(currentDate, "yyyy-MM-dd"),
      time: selectedTime,
      duration: serviceDuration,
      validateConflicts: true,
    };

    createBookingMutation.mutate(bookingData);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Real-Time Availability
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant={weekView ? "default" : "outline"}
                size="sm"
                onClick={() => setWeekView(!weekView)}
              >
                {weekView ? "Month View" : "Week View"}
              </Button>
              
              <Button
                variant={showConflicts ? "default" : "outline"}
                size="sm"
                onClick={() => setShowConflicts(!showConflicts)}
              >
                Show Conflicts
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Component */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && handleDateSelect(date)}
                disabled={(date) => {
                  if (isPast(date) && !isToday(date)) return true;
                  
                  const dayAvailability = availability.find(day => 
                    isSameDay(new Date(day.date), date)
                  );
                  
                  return dayAvailability?.isBlocked || false;
                }}
                modifiers={{
                  available: (date) => {
                    const dayAvailability = availability.find(day => 
                      isSameDay(new Date(day.date), date)
                    );
                    return dayAvailability && !dayAvailability.isBlocked && dayAvailability.slots.some(slot => slot.available);
                  },
                  fullyBooked: (date) => {
                    const dayAvailability = availability.find(day => 
                      isSameDay(new Date(day.date), date)
                    );
                    return dayAvailability && !dayAvailability.isBlocked && dayAvailability.slots.every(slot => !slot.available);
                  }
                }}
                modifiersStyles={{
                  available: { backgroundColor: '#dcfce7', color: '#166534' },
                  fullyBooked: { backgroundColor: '#fee2e2', color: '#991b1b' }
                }}
                className="rounded-md border"
              />
            </div>

            {/* Time Slots */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {format(currentDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                    <span className="text-xs text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                    <span className="text-xs text-gray-600">Booked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
                    <span className="text-xs text-gray-600">Conflict</span>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : selectedDateAvailability?.isBlocked ? (
                <div className="text-center py-8">
                  <X className="h-12 w-12 text-red-400 mx-auto mb-2" />
                  <p className="text-gray-600">Provider unavailable on this date</p>
                  <p className="text-sm text-gray-500">{selectedDateAvailability.blockReason}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {timeSlots.map((slot, index) => (
                      <motion.div
                        key={slot.time}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Button
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          className={`w-full justify-between h-auto p-3 ${
                            !slot.available 
                              ? "bg-red-50 border-red-200 text-red-600 cursor-not-allowed" 
                              : slot.conflictReason && showConflicts
                              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                              : slot.available 
                              ? "bg-green-50 border-green-200 hover:bg-green-100" 
                              : ""
                          }`}
                          onClick={() => slot.available && handleTimeSelect(slot.time)}
                          disabled={!slot.available || createBookingMutation.isPending}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{slot.displayTime}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {slot.available ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : slot.conflictReason ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            
                            {showConflicts && slot.conflictReason && (
                              <Badge variant="outline" className="text-xs">
                                {slot.conflictReason}
                              </Badge>
                            )}
                          </div>
                        </Button>
                        
                        {showConflicts && slot.clientName && (
                          <div className="text-xs text-gray-500 ml-4 mt-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Booked by {slot.clientName}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Quick Book Button */}
              {selectedTime && serviceId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-primary/5 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Ready to Book?</h4>
                      <p className="text-sm text-gray-600">
                        {format(currentDate, "MMM d, yyyy")} at {timeSlots.find(s => s.time === selectedTime)?.displayTime}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleQuickBook}
                      disabled={createBookingMutation.isPending}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      {createBookingMutation.isPending ? "Booking..." : "Book Now"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Status */}
      <AnimatePresence>
        {createBookingMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <div>
                    <h4 className="font-medium text-blue-900">Processing Your Booking</h4>
                    <p className="text-sm text-blue-700">Checking for conflicts and confirming availability...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}