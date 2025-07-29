import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  TrendingUp, 
  Target, 
  Users, 
  Star, 
  Calendar, 
  DollarSign, 
  Share2, 
  Gift, 
  Megaphone,
  BarChart3,
  Award,
  Camera,
  MessageSquare,
  Clock,
  MapPin,
  Zap,
  Trophy,
  Heart,
  UserPlus,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, subWeeks, subMonths } from "date-fns";

interface ProviderGrowthDashboardProps {
  providerId: number;
}

interface GrowthMetrics {
  profileViews: { current: number; previous: number; change: number };
  bookingRequests: { current: number; previous: number; change: number };
  conversionRate: { current: number; previous: number; change: number };
  averageRating: { current: number; previous: number; change: number };
  repeatClientRate: { current: number; previous: number; change: number };
  revenue: { current: number; previous: number; change: number };
}

interface MarketingCampaign {
  id: string;
  title: string;
  type: 'discount' | 'referral' | 'social' | 'loyalty';
  status: 'active' | 'scheduled' | 'completed' | 'draft';
  description: string;
  discount?: number;
  validUntil?: string;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
}

interface ProfileOptimization {
  completionScore: number;
  missingElements: string[];
  recommendations: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    action: string;
  }[];
}

export default function ProviderGrowthDashboard({ providerId }: ProviderGrowthDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    type: 'discount' as const,
    description: '',
    discount: 10,
    validUntil: '',
    maxUsage: 50,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch growth metrics
  const { data: growthMetrics, isLoading: metricsLoading } = useQuery<GrowthMetrics>({
    queryKey: ["/api/providers", providerId, "growth-metrics", selectedPeriod],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch marketing campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ["/api/providers", providerId, "campaigns"],
  });

  // Fetch profile optimization
  const { data: profileOptimization, isLoading: optimizationLoading } = useQuery<ProfileOptimization>({
    queryKey: ["/api/providers", providerId, "profile-optimization"],
  });

  // Create marketing campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: typeof newCampaign) => {
      const response = await apiRequest("POST", `/api/providers/${providerId}/campaigns`, campaignData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your marketing campaign is now active!",
      });
      
      setNewCampaign({
        title: '',
        type: 'discount',
        description: '',
        discount: 10,
        validUntil: '',
        maxUsage: 50,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "campaigns"]
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create campaigns",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Campaign Creation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update profile optimization action
  const updateProfileMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await apiRequest("POST", `/api/providers/${providerId}/optimize-profile`, {
        action
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile optimization is in progress!",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "profile-optimization"]
      });
    },
  });

  const renderMetricCard = (
    title: string, 
    icon: React.ReactNode, 
    current: number, 
    previous: number, 
    change: number, 
    format: 'number' | 'percentage' | 'currency' = 'number'
  ) => {
    const formatValue = (value: number) => {
      switch (format) {
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'currency':
          return `$${value.toFixed(2)}`;
        default:
          return value.toString();
      }
    };

    const isPositive = change >= 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  {icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{title}</p>
                  <p className="text-2xl font-bold">{formatValue(current)}</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-1 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-4 w-4 ${!isPositive ? 'rotate-180' : ''}`} />
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Previous period: {formatValue(previous)}</span>
                <span>{selectedPeriod}</span>
              </div>
              <Progress 
                value={Math.min((current / (previous || 1)) * 100, 100)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'discount': return <Gift className="h-4 w-4" />;
      case 'referral': return <UserPlus className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      case 'loyalty': return <Heart className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (metricsLoading || campaignsLoading || optimizationLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Period Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Dashboard</h1>
          <p className="text-gray-600">Track your business performance and grow your client base</p>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 3 months</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Growth Metrics */}
      {growthMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderMetricCard(
            "Profile Views",
            <Users className="h-5 w-5 text-secondary" />,
            growthMetrics.profileViews.current,
            growthMetrics.profileViews.previous,
            growthMetrics.profileViews.change
          )}
          
          {renderMetricCard(
            "Booking Requests",
            <Calendar className="h-5 w-5 text-secondary" />,
            growthMetrics.bookingRequests.current,
            growthMetrics.bookingRequests.previous,
            growthMetrics.bookingRequests.change
          )}
          
          {renderMetricCard(
            "Conversion Rate",
            <Target className="h-5 w-5 text-secondary" />,
            growthMetrics.conversionRate.current,
            growthMetrics.conversionRate.previous,
            growthMetrics.conversionRate.change,
            'percentage'
          )}
          
          {renderMetricCard(
            "Average Rating",
            <Star className="h-5 w-5 text-secondary" />,
            growthMetrics.averageRating.current,
            growthMetrics.averageRating.previous,
            growthMetrics.averageRating.change
          )}
          
          {renderMetricCard(
            "Repeat Clients",
            <Heart className="h-5 w-5 text-secondary" />,
            growthMetrics.repeatClientRate.current,
            growthMetrics.repeatClientRate.previous,
            growthMetrics.repeatClientRate.change,
            'percentage'
          )}
          
          {renderMetricCard(
            "Revenue",
            <DollarSign className="h-5 w-5 text-secondary" />,
            growthMetrics.revenue.current,
            growthMetrics.revenue.previous,
            growthMetrics.revenue.change,
            'currency'
          )}
        </div>
      )}

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Marketing Campaigns</TabsTrigger>
          <TabsTrigger value="optimization">Profile Optimization</TabsTrigger>
          <TabsTrigger value="insights">Growth Insights</TabsTrigger>
        </TabsList>

        {/* Marketing Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Marketing Campaigns</h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-secondary hover:bg-secondary/90">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Marketing Campaign</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Campaign Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., New Client Special"
                        value={newCampaign.title}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Campaign Type</Label>
                      <Select 
                        value={newCampaign.type} 
                        onValueChange={(value: any) => setNewCampaign(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Discount Offer</SelectItem>
                          <SelectItem value="referral">Referral Program</SelectItem>
                          <SelectItem value="social">Social Media Promo</SelectItem>
                          <SelectItem value="loyalty">Loyalty Reward</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your campaign..."
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="5"
                        max="50"
                        value={newCampaign.discount}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, discount: parseInt(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxUsage">Max Uses</Label>
                      <Input
                        id="maxUsage"
                        type="number"
                        min="1"
                        value={newCampaign.maxUsage}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, maxUsage: parseInt(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={newCampaign.validUntil}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, validUntil: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => createCampaignMutation.mutate(newCampaign)}
                    disabled={createCampaignMutation.isPending || !newCampaign.title}
                    className="w-full bg-secondary hover:bg-secondary/90"
                  >
                    {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Campaigns List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCampaignIcon(campaign.type)}
                        <h3 className="font-semibold">{campaign.title}</h3>
                      </div>
                      
                      <Badge className={getCampaignStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      {campaign.discount && (
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span className="font-medium">{campaign.discount}%</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Usage:</span>
                        <span className="font-medium">
                          {campaign.usageCount}{campaign.maxUsage ? `/${campaign.maxUsage}` : ''}
                        </span>
                      </div>
                      
                      {campaign.validUntil && (
                        <div className="flex justify-between">
                          <span>Valid Until:</span>
                          <span className="font-medium">
                            {format(new Date(campaign.validUntil), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Profile Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          {profileOptimization && (
            <>
              {/* Profile Completion Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Profile Completion Score
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl font-bold text-secondary">
                      {profileOptimization.completionScore}%
                    </div>
                    <Progress value={profileOptimization.completionScore} className="flex-1" />
                  </div>
                  
                  {profileOptimization.missingElements.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Missing elements:</p>
                      <div className="flex flex-wrap gap-2">
                        {profileOptimization.missingElements.map((element, index) => (
                          <Badge key={index} variant="outline">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Optimization Recommendations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommendations</h3>
                
                {profileOptimization.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={
                                rec.impact === 'high' ? 'destructive' : 
                                rec.impact === 'medium' ? 'default' : 'secondary'
                              }>
                                {rec.impact} impact
                              </Badge>
                              <h4 className="font-medium">{rec.title}</h4>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => updateProfileMutation.mutate(rec.action)}
                            disabled={updateProfileMutation.isPending}
                            className="ml-4"
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Fix
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Growth Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Peak Hours Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Peak Booking Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['9-11 AM', '12-2 PM', '3-5 PM', '6-8 PM'].map((time, index) => (
                    <div key={time} className="flex items-center justify-between">
                      <span className="text-sm">{time}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(4 - index) * 25} className="w-20" />
                        <span className="text-sm text-gray-600">{4 - index}0%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: '18-25 years', value: 25 },
                    { label: '26-35 years', value: 40 },
                    { label: '36-45 years', value: 20 },
                    { label: '46+ years', value: 15 }
                  ].map((demo) => (
                    <div key={demo.label} className="flex items-center justify-between">
                      <span className="text-sm">{demo.label}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={demo.value} className="w-20" />
                        <span className="text-sm text-gray-600">{demo.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performing Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Haircut & Style', bookings: 45, revenue: 1125 },
                    { name: 'Color Treatment', bookings: 32, revenue: 1280 },
                    { name: 'Braiding', bookings: 28, revenue: 980 }
                  ].map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 rounded-full">
                          <span className="text-sm font-bold text-secondary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-600">{service.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${service.revenue}</p>
                        <p className="text-sm text-gray-600">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Growth Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { tip: "Post before/after photos to increase bookings by 40%", icon: <Camera className="h-4 w-4" /> },
                    { tip: "Respond to reviews to improve client trust", icon: <MessageSquare className="h-4 w-4" /> },
                    { tip: "Offer package deals to increase average booking value", icon: <Gift className="h-4 w-4" /> },
                    { tip: "Share your location to attract nearby clients", icon: <MapPin className="h-4 w-4" /> }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-2">
                      <div className="text-secondary mt-1">{item.icon}</div>
                      <p className="text-sm text-gray-700">{item.tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}