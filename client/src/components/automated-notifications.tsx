import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Clock,
  MessageSquare,
  Mail,
  Smartphone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Settings,
  Send,
  History,
  Zap,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface AutomatedNotificationsProps {
  userId?: string;
  providerId?: number;
}

export default function AutomatedNotifications({ userId, providerId }: AutomatedNotificationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  const [preferences, setPreferences] = useState({
    appointmentReminders: true,
    bookingConfirmations: true,
    paymentNotifications: true,
    marketingMessages: false,
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    reminderTimings: {
      "24h": true,
      "2h": true,
      "30m": false
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    }
  });

  // Fetch user's notification preferences
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/communication-preferences`],
    enabled: !!userId,
  });

  // Fetch scheduled notifications
  const { data: scheduledNotifications } = useQuery({
    queryKey: [`/api/users/${userId}/scheduled-notifications`],
    enabled: !!userId,
  });

  // Fetch notification templates
  const { data: templates } = useQuery({
    queryKey: ["/api/notification-templates"],
  });

  // Fetch communication log
  const { data: communicationHistory } = useQuery({
    queryKey: [`/api/users/${userId}/communication-log`],
    enabled: !!userId,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: any) => {
      return apiRequest("POST", `/api/users/${userId}/communication-preferences`, newPreferences);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/communication-preferences`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    },
  });

  // Send test notification mutation
  const sendTestMutation = useMutation({
    mutationFn: async (data: { type: string; channel: string }) => {
      return apiRequest("POST", `/api/notifications/test`, {
        recipientId: userId,
        type: data.type,
        channel: data.channel
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: "Test notification has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (userPreferences && typeof userPreferences === 'object') {
      setPreferences({ ...preferences, ...userPreferences });
    }
  }, [userPreferences]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handlePreferenceUpdate = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handleTestNotification = (type: string, channel: string) => {
    sendTestMutation.mutate({ type, channel });
  };

  const notificationTypes = [
    {
      id: "appointment_reminder",
      name: "Appointment Reminders",
      description: "Automatic reminders before scheduled appointments",
      icon: Calendar,
      defaultChannels: ["sms", "email"]
    },
    {
      id: "booking_confirmation",
      name: "Booking Confirmations",
      description: "Instant confirmation when bookings are made",
      icon: CheckCircle,
      defaultChannels: ["email", "push"]
    },
    {
      id: "payment_notification",
      name: "Payment Notifications",
      description: "Updates about payments and transactions",
      icon: CheckCircle,
      defaultChannels: ["email", "sms"]
    },
    {
      id: "status_update",
      name: "Status Updates",
      description: "Changes to booking or appointment status",
      icon: AlertCircle,
      defaultChannels: ["push", "sms"]
    }
  ];

  if (preferencesLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Automated Notifications</h2>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Smart Automation
        </Badge>
      </div>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          {/* Communication Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Communication Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">SMS</h4>
                      <p className="text-sm text-gray-600">Text messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.smsEnabled}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, smsEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <p className="text-sm text-gray-600">Email notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailEnabled}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, emailEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">Push</h4>
                      <p className="text-sm text-gray-600">Browser notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushEnabled}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, pushEnabled: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <type.icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={preferences[type.id as keyof typeof preferences] as boolean}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, [type.id]: checked }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestNotification(type.id, 'email')}
                      disabled={sendTestMutation.isPending}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reminder Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Reminder Timing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label>24 hours before</Label>
                  <Switch
                    checked={preferences.reminderTimings["24h"]}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ 
                        ...prev, 
                        reminderTimings: { ...prev.reminderTimings, "24h": checked }
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>2 hours before</Label>
                  <Switch
                    checked={preferences.reminderTimings["2h"]}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ 
                        ...prev, 
                        reminderTimings: { ...prev.reminderTimings, "2h": checked }
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>30 minutes before</Label>
                  <Switch
                    checked={preferences.reminderTimings["30m"]}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ 
                        ...prev, 
                        reminderTimings: { ...prev.reminderTimings, "30m": checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handlePreferenceUpdate}
              disabled={updatePreferencesMutation.isPending}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(scheduledNotifications) && scheduledNotifications.length > 0 ? (
                  scheduledNotifications.map((notification: any) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(notification.status)}
                          <span className="font-medium">{notification.type}</span>
                        </div>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Scheduled for: {format(new Date(notification.scheduledFor), 'MMM dd, yyyy HH:mm')}</span>
                        <div className="flex items-center gap-1">
                          {notification.channels.map((channel: string) => (
                            <span key={channel} className="flex items-center gap-1">
                              {getChannelIcon(channel)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No scheduled notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Communication History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(communicationHistory) && communicationHistory.length > 0 ? (
                  communicationHistory.map((log: any) => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(log.type)}
                          <span className="font-medium">{log.subject || log.type}</span>
                        </div>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{log.content}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Sent: {format(new Date(log.sentAt), 'MMM dd, yyyy HH:mm')}</span>
                        {log.cost && <span>Cost: ${parseFloat(log.cost).toFixed(4)}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No communication history</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notification Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(templates) && templates.length > 0 ? (
                  templates.map((template: any) => (
                    <div key={template.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {template.emailTemplate && (
                          <div>
                            <Label className="text-xs text-gray-500">Email</Label>
                            <p className="line-clamp-2">{template.emailTemplate}</p>
                          </div>
                        )}
                        {template.smsTemplate && (
                          <div>
                            <Label className="text-xs text-gray-500">SMS</Label>
                            <p className="line-clamp-2">{template.smsTemplate}</p>
                          </div>
                        )}
                        {template.pushTemplate && (
                          <div>
                            <Label className="text-xs text-gray-500">Push</Label>
                            <p className="line-clamp-2">{template.pushTemplate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No templates available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}