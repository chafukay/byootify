import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { JobRequestSystem } from "@/components/job-request-system";
import WireframeAlignedDashboard from "@/components/wireframe-aligned-dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Calendar, DollarSign, Users, Star, 
  Clock, Plus, Bell, Briefcase, Camera
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function ProfessionalDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading]);

  const { data: professional, error: professionalError } = useQuery({
    queryKey: ["/api/professionals/me"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/providers/bookings"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Show error handling
  useEffect(() => {
    if (professionalError && isUnauthorizedError(professionalError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [professionalError, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = {
      confirmed: { color: "bg-green-100 text-green-800", label: "Confirmed" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      completed: { color: "bg-blue-100 text-blue-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" }
    }[status] || { color: "bg-gray-100 text-gray-800", label: "Unknown" };
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const totalEarnings = Array.isArray(bookings) ? 
    bookings.filter((b: any) => b.status === 'completed').reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0) : 0;
  
  const completedBookings = Array.isArray(bookings) ? 
    bookings.filter((b: any) => b.status === 'completed') : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || (professional as any)?.businessName || "Provider"}!
          </h1>
          <p className="text-gray-600 mt-2">Manage your beauty services and grow your business</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{Array.isArray(bookings) ? bookings.length : 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Services</p>
                  <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">4.8</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wireframes">Verification</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          {/* Wireframes-aligned Dashboard Tab */}
          <TabsContent value="wireframes" className="space-y-6">
            {professional && (professional as any)?.id && (
              <WireframeAlignedDashboard providerId={(professional as any).id} />
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(bookings) && bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.slice(0, 3).map((booking: any) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{booking.clientName || "Client"}</p>
                            <p className="text-sm text-gray-600">{booking.serviceName || "Service"}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            <p className="text-sm font-medium text-gray-900 mt-1">${booking.totalPrice || 0}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No bookings yet. Start attracting clients!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline" asChild>
                      <Link href="/onboarding/provider">
                        <Plus className="h-4 w-4 mr-2" />
                        Complete Your Profile
                      </Link>
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Camera className="h-4 w-4 mr-2" />
                      Add Portfolio Images
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      View Reviews
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(bookings) && bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{booking.clientName || "Client"}</p>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(booking.appointmentDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{booking.appointmentTime || "Time not set"}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${booking.totalPrice || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                    <p>When clients book your services, they'll appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="border-[#F25D22] border-2">
                <CardContent className="p-6 text-center">
                  <Bell className="h-12 w-12 text-[#F25D22] mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Direct Requests</h3>
                  <p className="text-gray-600 mb-4">Clients who liked your profile send direct requests</p>
                  <Button className="w-full">View Requests (3)</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Browse Jobs</h3>
                  <p className="text-gray-600 mb-4">Explore marketplace and submit proposals</p>
                  <Button variant="outline" className="w-full">Browse Now</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Quick Match</h3>
                  <p className="text-gray-600 mb-4">Auto-match with compatible clients</p>
                  <Button variant="outline" className="w-full">Enable Matching</Button>
                </CardContent>
              </Card>
            </div>

            <JobRequestSystem />
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Portfolio</h3>
                  <p className="mb-4">Upload images of your best work to attract more clients.</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Portfolio Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Completed Services</p>
                    <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Average Per Service</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${completedBookings.length > 0 ? (totalEarnings / completedBookings.length).toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}