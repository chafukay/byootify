import { useState } from "react";
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
  Calendar,
  CheckCircle,
  AlertCircle,
  Settings,
  RefreshCw as Sync,
  Clock,
  Link,
  Unlink,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Users,
  MapPin,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface CalendarIntegrationProps {
  userId: string;
  providerId?: number;
}

export default function CalendarIntegration({ userId, providerId }: CalendarIntegrationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  
  // Fetch calendar integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/calendar-integrations`],
    enabled: !!userId,
  });

  // Fetch calendar events
  const { data: calendarEvents } = useQuery({
    queryKey: [`/api/users/${userId}/calendar-events`],
    enabled: !!userId,
  });

  // Fetch sync status
  const { data: syncStatus } = useQuery({
    queryKey: [`/api/users/${userId}/calendar-sync-status`],
    enabled: !!userId,
  });

  // Connect calendar mutation
  const connectCalendarMutation = useMutation({
    mutationFn: async (data: { calendarType: string; redirectUrl: string }) => {
      return apiRequest("POST", `/api/users/${userId}/calendar-connect`, data);
    },
    onSuccess: (data: any) => {
      // Redirect to OAuth URL
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Disconnect calendar mutation
  const disconnectCalendarMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return apiRequest("DELETE", `/api/calendar-integrations/${integrationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Calendar has been disconnected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/calendar-integrations`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect calendar",
        variant: "destructive",
      });
    },
  });

  // Sync calendar mutation
  const syncCalendarMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return apiRequest("POST", `/api/calendar-integrations/${integrationId}/sync`);
    },
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "Calendar sync has been initiated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/calendar-events`] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync calendar",
        variant: "destructive",
      });
    },
  });

  // Update sync settings mutation
  const updateSyncSettingsMutation = useMutation({
    mutationFn: async (data: { integrationId: string; settings: any }) => {
      return apiRequest("PATCH", `/api/calendar-integrations/${data.integrationId}`, {
        settings: data.settings
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Sync settings have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/calendar-integrations`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sync settings",
        variant: "destructive",
      });
    },
  });

  const getCalendarIcon = (type: string) => {
    switch (type) {
      case 'google': return '🗓️';
      case 'outlook': return '📅';
      case 'apple': return '🍎';
      default: return '📆';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const handleConnectCalendar = (calendarType: string) => {
    const redirectUrl = `${window.location.origin}/calendar-callback`;
    connectCalendarMutation.mutate({ calendarType, redirectUrl });
  };

  const handleDisconnectCalendar = (integrationId: string) => {
    disconnectCalendarMutation.mutate(integrationId);
  };

  const handleSyncCalendar = (integrationId: string) => {
    syncCalendarMutation.mutate(integrationId);
  };

  const calendarProviders = [
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Sync with Google Calendar for seamless scheduling',
      icon: '🗓️',
      color: 'border-blue-200 bg-blue-50'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      description: 'Connect your Outlook calendar for unified scheduling',
      icon: '📅',
      color: 'border-orange-200 bg-orange-50'
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      description: 'Sync with iCloud Calendar across all your devices',
      icon: '🍎',
      color: 'border-gray-200 bg-gray-50'
    }
  ];

  if (isLoading) {
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
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Calendar Integration</h2>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Auto-Sync
        </Badge>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Connected Calendars */}
          {Array.isArray(integrations) && integrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Connected Calendars
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrations.map((integration: any) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCalendarIcon(integration.calendarType || 'google')}</span>
                        <div>
                          <h4 className="font-medium capitalize">{integration.calendarType} Calendar</h4>
                          <p className="text-sm text-gray-600">{integration.externalCalendarId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(integration.syncStatus)}>
                          {getStatusIcon(integration.syncStatus)}
                          {integration.syncStatus}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncCalendar(integration.id)}
                          disabled={syncCalendarMutation.isPending}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDisconnectCalendar(integration.id)}
                          disabled={disconnectCalendarMutation.isPending}
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-500">Sync Direction</Label>
                        <p className="capitalize">{integration.syncDirection}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Last Sync</Label>
                        <p>{integration.lastSyncAt ? format(new Date(integration.lastSyncAt), 'MMM dd, HH:mm') : 'Never'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <p className="flex items-center gap-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            integration.syncEnabled ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          {integration.syncEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add New Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Connect Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {calendarProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 border-2 rounded-lg ${provider.color} hover:shadow-md transition-all cursor-pointer`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{provider.description}</p>
                    
                    <Button
                      className="w-full"
                      onClick={() => handleConnectCalendar(provider.id)}
                      disabled={connectCalendarMutation.isPending}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Connect {provider.name}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Synced Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(calendarEvents) && calendarEvents.length > 0 ? (
                  calendarEvents.map((event: any) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.startTime), 'MMM dd, HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(event.syncStatus)}>
                          {event.syncStatus}
                        </Badge>
                      </div>

                      {event.attendees && event.attendees.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-3 w-3" />
                          {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No synced events found</p>
                    <p className="text-sm text-gray-400 mt-2">Connect a calendar to see your events here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrations && integrations.length > 0 ? (
                integrations.map((integration: any) => (
                  <div key={integration.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{integration.calendarType} Calendar</h4>
                      <Badge className={getStatusColor(integration.syncStatus)}>
                        {integration.syncStatus}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sync Direction</Label>
                        <Select
                          value={integration.syncDirection}
                          onValueChange={(value) => 
                            updateSyncSettingsMutation.mutate({
                              integrationId: integration.id,
                              settings: { ...integration.settings, syncDirection: value }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="import">Import Only</SelectItem>
                            <SelectItem value="export">Export Only</SelectItem>
                            <SelectItem value="bidirectional">Bidirectional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Sync</Label>
                          <p className="text-sm text-gray-600">Automatically sync changes</p>
                        </div>
                        <Switch
                          checked={integration.syncEnabled}
                          onCheckedChange={(checked) => 
                            updateSyncSettingsMutation.mutate({
                              integrationId: integration.id,
                              settings: { ...integration.settings, syncEnabled: checked }
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h5 className="font-medium">Event Preferences</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label>Include private events</Label>
                          <Switch
                            checked={integration.settings?.includePrivate || false}
                            onCheckedChange={(checked) => 
                              updateSyncSettingsMutation.mutate({
                                integrationId: integration.id,
                                settings: { ...integration.settings, includePrivate: checked }
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Sync reminders</Label>
                          <Switch
                            checked={integration.settings?.syncReminders || true}
                            onCheckedChange={(checked) => 
                              updateSyncSettingsMutation.mutate({
                                integrationId: integration.id,
                                settings: { ...integration.settings, syncReminders: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No calendar connections to configure</p>
                  <p className="text-sm text-gray-400 mt-2">Connect a calendar first to access settings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}