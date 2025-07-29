import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  UserPlus, Clock, Calendar, Phone, Mail, MessageSquare, 
  CheckCircle, X, Users, AlertCircle, Send, Star
} from "lucide-react";
import { format, isFuture, isPast } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const waitlistSchema = z.object({
  professionalId: z.number(),
  serviceId: z.string().min(1, "Service is required"),
  preferredDates: z.array(z.string()).min(1, "At least one preferred date is required"),
  preferredTimes: z.array(z.string()).min(1, "At least one preferred time is required"),
  contactMethod: z.enum(["email", "phone", "app"], { required_error: "Contact method is required" }),
  phone: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(["normal", "urgent", "flexible"]).default("normal"),
});

type WaitlistForm = z.infer<typeof waitlistSchema>;

interface WaitlistManagerProps {
  professionalId: number;
  services: Array<{ id: string; name: string; duration: number; price: string }>;
  isProvider?: boolean;
}

export default function WaitlistManager({ 
  professionalId, 
  services, 
  isProvider = false 
}: WaitlistManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedWaitlistItem, setSelectedWaitlistItem] = useState<any>(null);

  const { data: waitlistItems = [] } = useQuery({
    queryKey: ["/api/providers", professionalId, "waitlist"],
    enabled: !!professionalId,
  });

  const { data: userWaitlistStatus = {} } = useQuery({
    queryKey: ["/api/waitlist/status", professionalId],
    enabled: !!user && !isProvider,
  });

  const form = useForm<WaitlistForm>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      professionalId,
      priority: "normal",
      contactMethod: "app",
      preferredDates: [],
      preferredTimes: [],
    },
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: async (data: WaitlistForm) => {
      await apiRequest("POST", "/api/waitlist", data);
    },
    onSuccess: () => {
      toast({
        title: "Added to Waitlist",
        description: "You'll be notified when a spot becomes available.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist/status", professionalId] });
      setShowJoinForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Waitlist",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const notifyWaitlistMutation = useMutation({
    mutationFn: async ({ waitlistId, message }: { waitlistId: string; message: string }) => {
      await apiRequest("POST", `/api/waitlist/${waitlistId}/notify`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Notification Sent",
        description: "The client has been notified about the available slot.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", professionalId, "waitlist"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Notification",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFromWaitlistMutation = useMutation({
    mutationFn: async (waitlistId: string) => {
      await apiRequest("DELETE", `/api/waitlist/${waitlistId}`);
    },
    onSuccess: () => {
      toast({
        title: "Removed from Waitlist",
        description: "The client has been removed from the waitlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", professionalId, "waitlist"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Remove",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "flexible": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const onSubmit = (data: WaitlistForm) => {
    joinWaitlistMutation.mutate(data);
  };

  if (!isProvider) {
    // Client view - Join waitlist button and status
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(userWaitlistStatus as any)?.onWaitlist ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You're on the waitlist!</h3>
              <p className="text-gray-600 mb-4">
                Position: #{(userWaitlistStatus as any).position} • Added {format(new Date((userWaitlistStatus as any).createdAt), "MMM d, yyyy")}
              </p>
              <Badge className={getPriorityColor((userWaitlistStatus as any).priority)}>
                {(userWaitlistStatus as any).priority} priority
              </Badge>
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fully Booked</h3>
              <p className="text-gray-600 mb-4">
                This provider is currently fully booked. Join the waitlist to be notified when spots become available.
              </p>
              
              <Dialog open={showJoinForm} onOpenChange={setShowJoinForm}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Waitlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Join Waitlist</DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                              {service.name} - ${service.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Preferred Days</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                          <label key={day} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={form.watch("preferredDates").includes(day)}
                              onChange={(e) => {
                                const current = form.watch("preferredDates");
                                if (e.target.checked) {
                                  form.setValue("preferredDates", [...current, day]);
                                } else {
                                  form.setValue("preferredDates", current.filter(d => d !== day));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Preferred Times</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {timeSlots.map((time) => (
                          <label key={time} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={form.watch("preferredTimes").includes(time)}
                              onChange={(e) => {
                                const current = form.watch("preferredTimes");
                                if (e.target.checked) {
                                  form.setValue("preferredTimes", [...current, time]);
                                } else {
                                  form.setValue("preferredTimes", current.filter(t => t !== time));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{time}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority Level</Label>
                      <Select
                        value={form.watch("priority")}
                        onValueChange={(value: "normal" | "urgent" | "flexible") => 
                          form.setValue("priority", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flexible">Flexible - Any available time</SelectItem>
                          <SelectItem value="normal">Normal - Preferred times</SelectItem>
                          <SelectItem value="urgent">Urgent - Need appointment ASAP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="contactMethod">How should we contact you?</Label>
                      <Select
                        value={form.watch("contactMethod")}
                        onValueChange={(value: "email" | "phone" | "app") => 
                          form.setValue("contactMethod", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="app">In-app notification</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.watch("contactMethod") === "phone" && (
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          placeholder="Your phone number"
                          value={form.watch("phone") || ""}
                          onChange={(e) => form.setValue("phone", e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        placeholder="Any special requests or flexible scheduling preferences..."
                        value={form.watch("notes") || ""}
                        onChange={(e) => form.setValue("notes", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={joinWaitlistMutation.isPending}
                        className="flex-1"
                      >
                        {joinWaitlistMutation.isPending ? "Joining..." : "Join Waitlist"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowJoinForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Provider view - Manage waitlist
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Management
          </div>
          <Badge variant="outline">
            {(waitlistItems as any[]).length} waiting
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(waitlistItems as any[]).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No waitlist yet</h3>
            <p>When clients can't book immediately, they'll join your waitlist here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {(waitlistItems as any[]).map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {item.clientName || "Client"}
                        </h4>
                        <Badge variant="outline">#{index + 1}</Badge>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><span className="font-medium">Service:</span> {item.serviceName}</p>
                          <p><span className="font-medium">Added:</span> {format(new Date(item.createdAt), "MMM d, yyyy")}</p>
                          <p><span className="font-medium">Contact:</span> {item.contactMethod}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Preferred Days:</span> {item.preferredDates?.join(", ")}</p>
                          <p><span className="font-medium">Preferred Times:</span> {item.preferredTimes?.join(", ")}</p>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">"{item.notes}"</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Send className="h-4 w-4 mr-1" />
                            Notify
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Notify Client</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Message</Label>
                              <Textarea
                                placeholder="Hi! A spot just opened up. Would you like to book an appointment for [date/time]?"
                                rows={4}
                                onChange={(e) => setSelectedWaitlistItem({
                                  ...item,
                                  message: e.target.value
                                })}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  if (selectedWaitlistItem?.message) {
                                    notifyWaitlistMutation.mutate({
                                      waitlistId: item.id,
                                      message: selectedWaitlistItem.message
                                    });
                                  }
                                }}
                                disabled={notifyWaitlistMutation.isPending}
                                className="flex-1"
                              >
                                {notifyWaitlistMutation.isPending ? "Sending..." : "Send Notification"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromWaitlistMutation.mutate(item.id)}
                        disabled={removeFromWaitlistMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}