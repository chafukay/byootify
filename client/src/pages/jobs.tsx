import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { JobRequestSystem } from "@/components/job-request-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, DollarSign, MapPin, Clock, Bell, Eye, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Jobs() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Access Restricted",
        description: "Job marketplace is only available for registered providers. Please sign in to continue.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#F25D22] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Provider Job Marketplace</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse job requests from clients and manage your incoming service opportunities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <Briefcase className="h-8 w-8 text-[#F25D22]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Budget</p>
                  <p className="text-2xl font-bold text-gray-900">$180</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Location</p>
                  <p className="text-2xl font-bold text-gray-900">NYC</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold text-gray-900">2h</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-[#F25D22] border-2">
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 text-[#F25D22] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Direct Requests</h3>
              <p className="text-gray-600 mb-4">Clients who liked your profile can send you direct service requests</p>
              <Button className="w-full">View Requests (3)</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Browse Jobs</h3>
              <p className="text-gray-600 mb-4">Explore available job postings and submit competitive proposals</p>
              <Button variant="outline" className="w-full">Browse Marketplace</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Quick Match</h3>
              <p className="text-gray-600 mb-4">Get matched with clients based on your skills and location</p>
              <Button variant="outline" className="w-full">Enable Matching</Button>
            </CardContent>
          </Card>
        </div>

        {/* How Provider Marketplace Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">How Provider Marketplace Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F25D22] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Receive Requests</h3>
                <p className="text-gray-600">Get direct requests from clients who found you through search or referrals</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F25D22] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Browse & Bid</h3>
                <p className="text-gray-600">Explore available jobs and submit proposals with your pricing and timeline</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#F25D22] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Get Selected & Earn</h3>
                <p className="text-gray-600">Win jobs, provide excellent service, and build your reputation on the platform</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Request System */}
        <JobRequestSystem />
      </div>
      
      <Footer />
    </div>
  );
}