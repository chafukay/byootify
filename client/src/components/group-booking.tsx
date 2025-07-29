import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, Calendar as CalendarIcon, Clock, DollarSign, 
  Plus, Minus, X, PartyPopper, Gift, Crown, Star
} from "lucide-react";
import { format, isBefore, addHours } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const groupBookingSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  eventDate: z.date({ required_error: "Event date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  estimatedDuration: z.number().min(1, "Duration is required"),
  groupSize: z.number().min(2, "Group size must be at least 2").max(20, "Maximum 20 people"),
  eventType: z.enum(["birthday", "wedding", "bachelorette", "corporate", "girls-night", "spa-day", "other"]),
  location: z.enum(["provider-location", "client-location", "venue"]),
  venueAddress: z.string().optional(),
  organizer: z.object({
    name: z.string().min(1, "Organizer name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone number is required"),
  }),
  participants: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required").optional(),
    servicePreference: z.string().optional(),
  })).min(1, "At least one participant is required"),
  specialRequests: z.string().optional(),
  budget: z.number().optional(),
  needsEquipment: z.boolean().default(false),
  needsSupplies: z.boolean().default(false),
});

type GroupBookingForm = z.infer<typeof groupBookingSchema>;

interface GroupBookingProps {
  professionalId: number;
  services: Array<{ id: string; name: string; duration: number; price: string; category: string }>;
  onClose?: () => void;
}

export default function GroupBooking({ professionalId, services, onClose }: GroupBookingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<GroupBookingForm>({
    resolver: zodResolver(groupBookingSchema),
    defaultValues: {
      groupSize: 4,
      eventType: "birthday",
      location: "provider-location",
      needsEquipment: false,
      needsSupplies: false,
      participants: [{ name: "", email: "" }],
      organizer: { name: "", email: "", phone: "" },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  const createGroupBookingMutation = useMutation({
    mutationFn: async (data: GroupBookingForm) => {
      await apiRequest("POST", `/api/providers/${professionalId}/group-bookings`, data);
    },
    onSuccess: () => {
      toast({
        title: "Group Booking Request Sent",
        description: "The provider will review your request and contact you soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create group booking.",
        variant: "destructive",
      });
    },
  });

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"
  ];

  const eventTypes = [
    { value: "birthday", label: "Birthday Party", icon: "🎂" },
    { value: "wedding", label: "Wedding Party", icon: "💒" },
    { value: "bachelorette", label: "Bachelorette Party", icon: "👰" },
    { value: "corporate", label: "Corporate Event", icon: "💼" },
    { value: "girls-night", label: "Girls Night Out", icon: "💅" },
    { value: "spa-day", label: "Spa Day", icon: "🧖‍♀️" },
    { value: "other", label: "Other Event", icon: "🎉" },
  ];

  // Calculate pricing
  const selectedService = services.find(s => s.id === form.watch("serviceId"));
  const groupSize = form.watch("groupSize");
  const basePrice = selectedService ? parseFloat(selectedService.price) : 0;
  const groupDiscount = groupSize >= 5 ? 0.15 : groupSize >= 3 ? 0.1 : 0;
  const subtotal = basePrice * groupSize;
  const discount = subtotal * groupDiscount;
  const total = subtotal - discount;

  const adjustGroupSize = (change: number) => {
    const currentSize = form.watch("groupSize");
    const newSize = Math.max(2, Math.min(20, currentSize + change));
    form.setValue("groupSize", newSize);
    
    // Adjust participants array
    const currentParticipants = form.watch("participants");
    if (newSize > currentParticipants.length) {
      const toAdd = newSize - currentParticipants.length;
      for (let i = 0; i < toAdd; i++) {
        append({ name: "", email: "" });
      }
    } else if (newSize < currentParticipants.length) {
      const toRemove = currentParticipants.length - newSize;
      for (let i = 0; i < toRemove; i++) {
        remove(currentParticipants.length - 1 - i);
      }
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = (data: GroupBookingForm) => {
    createGroupBookingMutation.mutate(data);
  };

  const getEventTypeEmoji = (type: string) => {
    return eventTypes.find(et => et.value === type)?.icon || "🎉";
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
            <Users className="h-5 w-5" />
            Book Group Event
            <span className="text-2xl ml-2">{getEventTypeEmoji(form.watch("eventType"))}</span>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Event Details</h3>
                    <p className="text-gray-600">Tell us about your special event</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select
                        value={form.watch("eventType")}
                        onValueChange={(value: any) => form.setValue("eventType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="service">Service</Label>
                      <Select
                        value={form.watch("serviceId")}
                        onValueChange={(value) => form.setValue("serviceId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
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
                      <Label htmlFor="eventDate">Event Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {form.watch("eventDate") ? 
                              format(form.watch("eventDate"), "PPP") : 
                              "Pick event date"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.watch("eventDate")}
                            onSelect={(date) => date && form.setValue("eventDate", date)}
                            disabled={(date) => isBefore(date, new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Select
                        value={form.watch("startTime")}
                        onValueChange={(value) => form.setValue("startTime", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="groupSize">Group Size</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustGroupSize(-1)}
                        disabled={groupSize <= 2}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span className="text-2xl font-bold">{groupSize}</span>
                        <span className="text-gray-600">people</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustGroupSize(1)}
                        disabled={groupSize >= 20}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Groups of 3+ get 10% discount • Groups of 5+ get 15% discount
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Location & Logistics</h3>
                    <p className="text-gray-600">Where should we set up for your event?</p>
                  </div>

                  <div>
                    <Label>Location</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      {[
                        { value: "provider-location", label: "Provider's Studio", desc: "Come to our location" },
                        { value: "client-location", label: "Your Location", desc: "We come to you" },
                        { value: "venue", label: "Event Venue", desc: "Third-party location" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            form.watch("location") === option.value 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            checked={form.watch("location") === option.value}
                            onChange={(e) => form.setValue("location", e.target.value as any)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-600">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {(form.watch("location") === "client-location" || form.watch("location") === "venue") && (
                    <div>
                      <Label htmlFor="venueAddress">Address</Label>
                      <Textarea
                        placeholder="Enter the full address where the event will take place..."
                        value={form.watch("venueAddress") || ""}
                        onChange={(e) => form.setValue("venueAddress", e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        step="0.5"
                        value={form.watch("estimatedDuration") || ""}
                        onChange={(e) => form.setValue("estimatedDuration", parseFloat(e.target.value))}
                        placeholder="3"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        How long do you expect the entire session to take?
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="budget">Budget (Optional)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.watch("budget") || ""}
                        onChange={(e) => form.setValue("budget", parseFloat(e.target.value))}
                        placeholder="500"
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Your approximate budget for the event
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Additional Services</Label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.watch("needsEquipment")}
                          onCheckedChange={(checked) => form.setValue("needsEquipment", !!checked)}
                        />
                        <span>Equipment rental needed (chairs, tables, lighting)</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.watch("needsSupplies")}
                          onCheckedChange={(checked) => form.setValue("needsSupplies", !!checked)}
                        />
                        <span>Professional supplies & products included</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Participant Information</h3>
                    <p className="text-gray-600">Who will be joining the event?</p>
                  </div>

                  {/* Organizer Info */}
                  <Card className="p-4 bg-primary/5">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Event Organizer
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="organizer.name">Full Name</Label>
                        <Input
                          placeholder="Your name"
                          value={form.watch("organizer.name")}
                          onChange={(e) => form.setValue("organizer.name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="organizer.email">Email</Label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={form.watch("organizer.email")}
                          onChange={(e) => form.setValue("organizer.email", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="organizer.phone">Phone</Label>
                        <Input
                          placeholder="(555) 123-4567"
                          value={form.watch("organizer.phone")}
                          onChange={(e) => form.setValue("organizer.phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Participants */}
                  <div>
                    <h4 className="font-semibold mb-4">Participants ({groupSize} people)</h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                          <div>
                            <Label htmlFor={`participants.${index}.name`}>Name</Label>
                            <Input
                              placeholder="Participant name"
                              value={form.watch(`participants.${index}.name`)}
                              onChange={(e) => form.setValue(`participants.${index}.name`, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`participants.${index}.email`}>Email (Optional)</Label>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              value={form.watch(`participants.${index}.email`) || ""}
                              onChange={(e) => form.setValue(`participants.${index}.email`, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`participants.${index}.servicePreference`}>Service Preference</Label>
                            <Select
                              value={form.watch(`participants.${index}.servicePreference`) || ""}
                              onValueChange={(value) => form.setValue(`participants.${index}.servicePreference`, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Any service" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Any service</SelectItem>
                                {services.map((service) => (
                                  <SelectItem key={service.id} value={service.name}>
                                    {service.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Review & Confirm</h3>
                    <p className="text-gray-600">Please review your booking details</p>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-4">Event Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Event Type:</span>
                          <span className="flex items-center gap-1">
                            <span>{getEventTypeEmoji(form.watch("eventType"))}</span>
                            {eventTypes.find(t => t.value === form.watch("eventType"))?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span>{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date & Time:</span>
                          <span>
                            {form.watch("eventDate") && format(form.watch("eventDate"), "MMM d, yyyy")} at {form.watch("startTime")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{form.watch("estimatedDuration")} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Group Size:</span>
                          <span>{groupSize} people</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span>{form.watch("location").replace("-", " ")}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-4">Pricing Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Price per Person:</span>
                          <span>${basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal ({groupSize} people):</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {groupDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Group Discount ({(groupDiscount * 100).toFixed(0)}%):</span>
                            <span>-${discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {groupDiscount > 0 && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <Gift className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              You saved ${discount.toFixed(2)} with our group discount!
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      placeholder="Any special requests, dietary restrictions, accessibility needs, or other important details..."
                      value={form.watch("specialRequests") || ""}
                      onChange={(e) => form.setValue("specialRequests", e.target.value)}
                      rows={4}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep}>
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createGroupBookingMutation.isPending}
                    className="gradient-primary"
                  >
                    {createGroupBookingMutation.isPending ? "Submitting..." : "Submit Booking Request"}
                  </Button>
                )}
                {onClose && (
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}