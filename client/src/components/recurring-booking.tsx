import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Repeat, Clock, Users, X } from "lucide-react";
import { format, addDays, addWeeks, addMonths, isBefore, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const recurringBookingSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional(),
  frequency: z.enum(["weekly", "biweekly", "monthly"], { required_error: "Frequency is required" }),
  timeSlot: z.string().min(1, "Time slot is required"),
  occurrences: z.number().min(1).max(52).optional(),
  skipDates: z.array(z.date()).optional(),
  notes: z.string().optional(),
});

type RecurringBookingForm = z.infer<typeof recurringBookingSchema>;

interface RecurringBookingProps {
  professionalId: number;
  services: Array<{ id: string; name: string; duration: number; price: string }>;
  availableSlots: string[];
  onClose?: () => void;
}

export default function RecurringBooking({ 
  professionalId, 
  services, 
  availableSlots, 
  onClose 
}: RecurringBookingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [skipDates, setSkipDates] = useState<Date[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const form = useForm<RecurringBookingForm>({
    resolver: zodResolver(recurringBookingSchema),
    defaultValues: {
      frequency: "weekly",
      occurrences: 12,
      skipDates: [],
    },
  });

  const createRecurringBookingMutation = useMutation({
    mutationFn: async (data: RecurringBookingForm) => {
      await apiRequest("POST", `/api/providers/${professionalId}/recurring-bookings`, {
        ...data,
        skipDates,
      });
    },
    onSuccess: () => {
      toast({
        title: "Recurring Booking Created",
        description: "Your recurring appointments have been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create recurring booking.",
        variant: "destructive",
      });
    },
  });

  const generateBookingDates = () => {
    const { startDate, frequency, occurrences, endDate } = form.getValues();
    if (!startDate || !frequency) return [];

    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    let count = 0;

    while (count < (occurrences || 52)) {
      // Check if we've reached the end date
      if (endDate && isAfter(currentDate, endDate)) break;
      
      // Skip if date is in skip list
      if (!skipDates.some(skipDate => 
        skipDate.toDateString() === currentDate.toDateString()
      )) {
        dates.push(new Date(currentDate));
      }

      // Increment date based on frequency
      switch (frequency) {
        case "weekly":
          currentDate = addDays(currentDate, 7);
          break;
        case "biweekly":
          currentDate = addDays(currentDate, 14);
          break;
        case "monthly":
          currentDate = addMonths(currentDate, 1);
          break;
      }
      count++;
    }

    return dates;
  };

  const handleSkipDate = (date: Date) => {
    const dateString = date.toDateString();
    if (skipDates.some(skipDate => skipDate.toDateString() === dateString)) {
      setSkipDates(skipDates.filter(skipDate => 
        skipDate.toDateString() !== dateString
      ));
    } else {
      setSkipDates([...skipDates, date]);
    }
  };

  const removeSkipDate = (date: Date) => {
    setSkipDates(skipDates.filter(skipDate => 
      skipDate.toDateString() !== date.toDateString()
    ));
  };

  const bookingDates = generateBookingDates();
  const selectedService = services.find(s => s.id === form.watch("serviceId"));
  const totalCost = selectedService ? 
    parseFloat(selectedService.price) * bookingDates.length : 0;

  const onSubmit = (data: RecurringBookingForm) => {
    if (bookingDates.length === 0) {
      toast({
        title: "No Booking Dates",
        description: "Please adjust your settings to generate booking dates.",
        variant: "destructive",
      });
      return;
    }

    createRecurringBookingMutation.mutate({
      ...data,
      skipDates,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Schedule Recurring Appointments
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Settings */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={form.watch("serviceId")}
                    onValueChange={(value) => form.setValue("serviceId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge variant="outline">{service.duration}min</Badge>
                              <span className="font-semibold">${service.price}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={form.watch("frequency")}
                    onValueChange={(value: "weekly" | "biweekly" | "monthly") => 
                      form.setValue("frequency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timeSlot">Preferred Time</Label>
                  <Select
                    value={form.watch("timeSlot")}
                    onValueChange={(value) => form.setValue("timeSlot", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("startDate") ? 
                            format(form.watch("startDate"), "PPP") : 
                            "Pick a date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch("startDate")}
                          onSelect={(date) => date && form.setValue("startDate", date)}
                          disabled={(date) => isBefore(date, new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="occurrences">Number of Sessions</Label>
                    <Input
                      type="number"
                      min="1"
                      max="52"
                      value={form.watch("occurrences") || ""}
                      onChange={(e) => form.setValue("occurrences", parseInt(e.target.value))}
                      placeholder="12"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Preview & Skip Dates */}
              <div className="space-y-4">
                <div>
                  <Label>Booking Preview</Label>
                  <Card className="p-4 bg-gray-50">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Service:</span>
                        <span className="font-medium">{selectedService?.name || "None selected"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Frequency:</span>
                        <span className="font-medium">{form.watch("frequency")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Sessions:</span>
                        <span className="font-medium">{bookingDates.length}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t pt-2">
                        <span>Total Cost:</span>
                        <span>${totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <Label>Skip Specific Dates (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {showCalendar ? "Hide Calendar" : "Select Dates to Skip"}
                  </Button>

                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <Calendar
                          mode="multiple"
                          selected={skipDates}
                          onSelect={(dates) => setSkipDates(dates || [])}
                          disabled={(date) => isBefore(date, new Date())}
                          className="rounded-md border"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {skipDates.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Dates to Skip:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skipDates.map((date, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {format(date, "MMM d")}
                            <button
                              type="button"
                              onClick={() => removeSkipDate(date)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Dates List */}
            {bookingDates.length > 0 && (
              <div>
                <Label>Scheduled Appointments ({bookingDates.length} sessions)</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {bookingDates.slice(0, 12).map((date, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-white rounded border"
                      >
                        {format(date, "MMM d, yyyy")}
                      </div>
                    ))}
                    {bookingDates.length > 12 && (
                      <div className="text-sm p-2 bg-primary/10 rounded border text-center">
                        +{bookingDates.length - 12} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Input
                placeholder="Any special requests or notes..."
                value={form.watch("notes") || ""}
                onChange={(e) => form.setValue("notes", e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createRecurringBookingMutation.isPending}
                className="flex-1"
              >
                {createRecurringBookingMutation.isPending ? "Scheduling..." : "Schedule Recurring Appointments"}
              </Button>
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}