import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ProviderGrowthDashboard from "@/components/provider-growth-dashboard";
import ReferralProgram from "@/components/referral-program";
import SocialMediaIntegration from "@/components/social-media-integration";
import { 
  TrendingUp, 
  Share2, 
  Users, 
  Target, 
  Zap, 
  ArrowLeft,
  BarChart3,
  Megaphone,
  Gift,
  Instagram
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function ProviderGrowthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch provider profile to get provider ID
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["/api/providers/profile"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access provider growth tools",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || providerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Provider Profile Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to complete your provider profile to access growth tools.
            </p>
            <Button 
              onClick={() => setLocation("/provider-dashboard")}
              className="bg-secondary hover:bg-secondary/90"
            >
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/provider-dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Growth Center</h1>
                <p className="text-gray-600 mt-1">
                  Powerful tools to grow your beauty business
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                Pro Tools
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Welcome, {provider.businessName || user?.firstName}
                </p>
                <p className="text-xs text-gray-500">
                  Provider ID: {provider.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Profile Views</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Referrals</p>
                  <p className="text-2xl font-bold">87</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Social Reach</p>
                  <p className="text-2xl font-bold">5.2K</p>
                </div>
                <Instagram className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Conversion</p>
                  <p className="text-2xl font-bold">24.5%</p>
                </div>
                <Target className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth Tools Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="referrals" 
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Referrals</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="social" 
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Social Media</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="campaigns" 
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">Marketing</span>
              </TabsTrigger>
            </TabsList>

            {/* Analytics Dashboard Tab */}
            <TabsContent value="dashboard">
              <ProviderGrowthDashboard providerId={provider.id} />
            </TabsContent>

            {/* Referral Program Tab */}
            <TabsContent value="referrals">
              <ReferralProgram providerId={provider.id} />
            </TabsContent>

            {/* Social Media Integration Tab */}
            <TabsContent value="social">
              <SocialMediaIntegration providerId={provider.id} />
            </TabsContent>

            {/* Marketing Campaigns Tab */}
            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Marketing Campaigns
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Advanced Marketing Tools
                    </h3>
                    <p className="text-gray-600 mb-6">
                      This section includes email campaigns, promotional codes, and automated marketing workflows.
                    </p>
                    <Badge variant="outline" className="text-sm">
                      Coming Soon
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Growth Tips Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 w-80 z-10 hidden xl:block"
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Growth Tips</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Complete Your Profile</h4>
              <p className="text-sm text-blue-700">
                Profiles with photos get 40% more bookings
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">Share Referral Links</h4>
              <p className="text-sm text-green-700">
                Earn $10 for every successful referral
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-1">Post Regularly</h4>
              <p className="text-sm text-purple-700">
                Weekly posts increase visibility by 60%
              </p>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-1">Respond to Reviews</h4>
              <p className="text-sm text-orange-700">
                Quick responses improve your rating
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}