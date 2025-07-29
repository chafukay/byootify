import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

interface BookingCalendarProps {
  availability: Array<{
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    isActive: boolean;
  }>;
  selectedDate: Date | null;
  selectedTime: string;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  duration: number; // in minutes
}

export default function BookingCalendar({
  availability,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  duration = 60,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  // Check if a date is available
  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can't book in the past
    if (date < today) return false;
    
    const dayOfWeek = date.getDay();
    return availability.some(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isActive
    );
  };

  // Get available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isActive
    );
    
    const slots = [];
    
    for (const slot of dayAvailability) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Generate 30-minute slots
      for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        // Check if this slot is in the future for today
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hours, mins, 0, 0);
        
        const now = new Date();
        if (selectedDate.toDateString() === now.toDateString() && slotDateTime <= now) {
          continue; // Skip past time slots for today
        }
        
        slots.push(timeString);
      }
    }
    
    return slots;
  }, [selectedDate, availability, duration]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Date
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[120px] text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              const available = isDateAvailable(date);
              const current = isCurrentMonth(date);
              const today = isToday(date);
              const selected = isSelectedDate(date);
              
              return (
                <button
                  key={index}
                  onClick={() => available && onDateSelect(date)}
                  disabled={!available}
                  className={`
                    p-2 text-sm rounded-lg transition-colors relative
                    ${!current ? 'text-gray-300' : ''}
                    ${available && current ? 'hover:bg-gray-100 cursor-pointer' : ''}
                    ${!available ? 'cursor-not-allowed opacity-50' : ''}
                    ${selected ? 'bg-primary text-white hover:bg-primary/90' : ''}
                    ${today && !selected ? 'bg-blue-100 text-blue-800 font-medium' : ''}
                  `}
                >
                  {date.getDate()}
                  {available && current && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Times for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableTimeSlots.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTimeSelect(time)}
                    className="justify-center"
                  >
                    {formatTime(time)}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available time slots for this date.</p>
                <p className="text-sm">Please select a different date.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Duration Info */}
      {selectedDate && selectedTime && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Selected Appointment</p>
                <p className="text-sm text-green-600">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {formatTime(selectedTime)}
                </p>
              </div>
              <Badge variant="outline" className="bg-white border-green-200 text-green-800">
                {duration} min
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
