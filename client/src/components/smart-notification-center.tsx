import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bell, Settings, Calendar, DollarSign, Star, Users, 
  CheckCircle, X, Clock, AlertTriangle, Info, Zap,
  Mail, Smartphone, MessageSquare, Volume2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
  createdAt: string;
}

interface NotificationPreference {
  category: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  frequency: string;
}

export function SmartNotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notification preferences
  const { data: preferences = [] } = useQuery({
    queryKey: ['/api/notifications/preferences'],
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Dismiss notification
  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<NotificationPreference>) => {
      await apiRequest('PUT', '/api/notifications/preferences', preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
    },
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Zap className="h-4 w-4 text-orange-500" />;
      case 'normal': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'business': return <Users className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'booking': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'marketing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter((notification: Notification) => {
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
    if (showUnreadOnly && notification.isRead) return false;
    return true;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 text-[#F25D22]" />
          <h1 className="text-2xl font-bold text-gray-900">Smart Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show unread only</span>
          <Switch
            checked={showUnreadOnly}
            onCheckedChange={setShowUnreadOnly}
          />
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All ({notifications.length})
            </Button>
            {['booking', 'payment', 'business', 'marketing', 'system'].map((category) => {
              const count = notifications.filter((n: Notification) => n.category === category).length;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {getCategoryIcon(category)}
                  <span className="ml-1">{category} ({count})</span>
                </Button>
              );
            })}
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">
                      {showUnreadOnly ? "You're all caught up! No unread notifications." : "You don't have any notifications yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification: Notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-all duration-200 hover:shadow-md ${
                      !notification.isRead ? 'border-l-4 border-l-[#F25D22] bg-blue-50/50' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            {getPriorityIcon(notification.priority)}
                            <Badge className={getCategoryColor(notification.category)}>
                              {notification.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          <div>
                            <h4 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1">
                              {notification.message}
                            </p>
                          </div>

                          {notification.actionRequired && notification.actionText && (
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={() => handleNotificationAction(notification)}
                            >
                              {notification.actionText}
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissMutation.mutate(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {['booking', 'payment', 'business', 'marketing', 'system'].map((category) => {
                const pref = preferences.find((p: NotificationPreference) => p.category === category) || {
                  category,
                  inAppEnabled: true,
                  emailEnabled: true,
                  smsEnabled: false,
                  pushEnabled: true,
                  frequency: 'immediate'
                };

                return (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <h3 className="font-semibold capitalize">{category} Notifications</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">In-App</span>
                        </div>
                        <Switch
                          checked={pref.inAppEnabled}
                          onCheckedChange={(checked) => {
                            updatePreferencesMutation.mutate({
                              category,
                              inAppEnabled: checked
                            });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Email</span>
                        </div>
                        <Switch
                          checked={pref.emailEnabled}
                          onCheckedChange={(checked) => {
                            updatePreferencesMutation.mutate({
                              category,
                              emailEnabled: checked
                            });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">SMS</span>
                        </div>
                        <Switch
                          checked={pref.smsEnabled}
                          onCheckedChange={(checked) => {
                            updatePreferencesMutation.mutate({
                              category,
                              smsEnabled: checked
                            });
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Push</span>
                        </div>
                        <Switch
                          checked={pref.pushEnabled}
                          onCheckedChange={(checked) => {
                            updatePreferencesMutation.mutate({
                              category,
                              pushEnabled: checked
                            });
                          }}
                        />
                      </div>
                    </div>
                    <Separator />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Bell className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                <p className="text-sm text-gray-600">Total Notifications</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter((n: Notification) => n.isRead).length}
                </p>
                <p className="text-sm text-gray-600">Read Notifications</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter((n: Notification) => n.actionRequired).length}
                </p>
                <p className="text-sm text-gray-600">Action Required</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}