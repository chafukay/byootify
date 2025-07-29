import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import PortfolioUpload from "@/components/portfolio-upload";
import EarningsTracker from "@/components/earnings-tracker";
import NotificationCenter from "@/components/notification-center";
import { JobRequestSystem } from "@/components/job-request-system";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, DollarSign, Users, Star, TrendingUp, 
  Clock, Phone, Mail, Edit, Plus, MoreHorizontal,
  CheckCircle, AlertCircle, XCircle, Award, Zap,
  Heart, Sparkles, Brain, Camera, Play, MessageSquare,
  Globe, Shield, Target, Rocket, Crown, Trophy,
  Sun, Moon, Coffee, Smile, Frown, Meh, Angry, 
  Video, Headphones, Palette, Lightbulb, Bell, Briefcase
} from "lucide-react";
import { Link, useLocation } from "wouter";

// Mood emoji mapping
const moodEmojis = {
  relaxed: { emoji: "😌", color: "bg-blue-100 text-blue-800", label: "Relaxed" },
  energetic: { emoji: "⚡", color: "bg-yellow-100 text-yellow-800", label: "Energetic" },
  professional: { emoji: "💼", color: "bg-gray-100 text-gray-800", label: "Professional" },
  creative: { emoji: "🎨", color: "bg-purple-100 text-purple-800", label: "Creative" },
  luxurious: { emoji: "✨", color: "bg-amber-100 text-amber-800", label: "Luxurious" },
};

// Skill badge configurations
const skillBadgeConfigs = {
  expertise: { icon: Award, color: "bg-blue-500" },
  achievement: { icon: Trophy, color: "bg-yellow-500" },
  certification: { icon: Shield, color: "bg-green-500" },
};

export default function ProfessionalDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedMood, setSelectedMood] = useState("relaxed");
  const [greetingTime, setGreetingTime] = useState("morning");
  const [showPortfolioUpload, setShowPortfolioUpload] = useState(false);

  // Dynamic greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreetingTime("morning");
    else if (hour < 17) setGreetingTime("afternoon");
    else setGreetingTime("evening");
  }, []);

  const { data: professional } = useQuery({
    queryKey: ["/api/professionals/me"],
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/providers/bookings"],
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/providers", professional?.id, "services"],
    enabled: !!professional?.id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/providers", professional?.id, "reviews"],
    enabled: !!professional?.id,
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ["/api/providers", professional?.id, "portfolio"],
    enabled: !!professional?.id,
  });

  const { data: skillBadges = [] } = useQuery({
    queryKey: ["/api/providers", professional?.id, "skill-badges"],
    enabled: !!professional?.id,
  });

  const { data: aiInsights } = useQuery({
    queryKey: ["/api/providers", professional?.id, "ai-insights"],
    enabled: !!professional?.id,
  });

  const { data: videoConsultations = [] } = useQuery({
    queryKey: ["/api/providers", professional?.id, "video-consultations"],
    enabled: !!professional?.id,
  });

  // Mutations for interactive features
  const createSkillBadgeMutation = useMutation({
    mutationFn: async (badgeData: any) => {
      const response = await apiRequest("POST", "/api/skill-badges", badgeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers", professional?.id, "skill-badges"] });
      toast({ title: "Skill badge added!", description: "Your new achievement is now visible to clients." });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Please sign in again.", variant: "destructive" });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Error", description: "Failed to add skill badge.", variant: "destructive" });
    },
  });

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Provider Profile Found</h2>
              <p className="text-gray-600 mb-6">You haven't created a provider profile yet.</p>
              <Link href="/onboarding/provider">
                <Button className="gradient-primary">Create Provider Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = professional.businessName || 
    `${user?.firstName} ${user?.lastName}` ||
    "Your Business";

  // Calculate stats
  const upcomingBookings = bookings.filter((booking: any) => 
    new Date(booking.appointmentDate) > new Date() && booking.status === 'confirmed'
  );

  const completedBookings = bookings.filter((booking: any) => 
    booking.status === 'completed'
  );

  const totalRevenue = completedBookings.reduce((sum: number, booking: any) => 
    sum + parseFloat(booking.totalPrice), 0
  );

  const averageRating = parseFloat(professional.rating || "0");
  const totalReviews = professional.reviewCount || 0;

  const recentBookings = bookings.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Personalized Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl p-6 mb-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-4 border-white/20">
                  <AvatarImage src={professional.profileImageUrl} alt={displayName} />
                  <AvatarFallback className="text-2xl bg-white/20 text-white">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-2xl">
                      {greetingTime === "morning" ? "🌅" : greetingTime === "afternoon" ? "☀️" : "🌙"}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      Good {greetingTime}, {displayName}!
                    </h1>
                  </div>
                  <p className="text-white/80 text-lg">
                    Ready to make beauty dreams come true? ✨
                  </p>
                  
                  {/* Mood Selector */}
                  <div className="flex items-center space-x-2 mt-3">
                    <span className="text-sm text-white/70">Today's vibe:</span>
                    <div className="flex space-x-2">
                      {Object.entries(moodEmojis).map(([mood, config]) => (
                        <button
                          key={mood}
                          onClick={() => setSelectedMood(mood)}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            selectedMood === mood 
                              ? "bg-white/30 shadow-lg scale-110" 
                              : "bg-white/10 hover:bg-white/20"
                          }`}
                        >
                          {config.emoji} {config.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => setLocation("/onboarding/provider")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => setLocation("/provider-growth")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Growth Tools
                </Button>
                <Button className="bg-white text-primary hover:bg-white/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
        </motion.div>

        {/* Enhanced Stats Cards with Micro-interactions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upcoming Bookings</p>
                    <motion.p 
                      className="text-2xl font-bold text-gray-900"
                      initial={{ scale: 1 }}
                      animate={{ scale: upcomingBookings.length > 0 ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {upcomingBookings.length}
                    </motion.p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">+12% this week</span>
                    </div>
                  </div>
                  <motion.div 
                    className="p-3 bg-blue-100 rounded-full"
                    whileHover={{ rotate: 10 }}
                  >
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <motion.p 
                      className="text-2xl font-bold text-gray-900"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      ${totalRevenue.toFixed(2)}
                    </motion.p>
                    <div className="flex items-center mt-1">
                      <Zap className="h-3 w-3 text-amber-500 mr-1" />
                      <span className="text-xs text-amber-600">Trending up</span>
                    </div>
                  </div>
                  <motion.div 
                    className="p-3 bg-green-100 rounded-full"
                    whileHover={{ scale: 1.1 }}
                  >
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Happy Clients</p>
                    <motion.p 
                      className="text-2xl font-bold text-gray-900"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {completedBookings.length}
                    </motion.p>
                    <div className="flex items-center mt-1">
                      <Heart className="h-3 w-3 text-pink-500 mr-1" />
                      <span className="text-xs text-pink-600">Growing community</span>
                    </div>
                  </div>
                  <motion.div 
                    className="p-3 bg-purple-100 rounded-full"
                    whileHover={{ rotate: -10 }}
                  >
                    <Users className="h-6 w-6 text-purple-600" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <div className="flex items-center space-x-2">
                      <motion.p 
                        className="text-2xl font-bold text-gray-900"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        {averageRating.toFixed(1)}
                      </motion.p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.1 }}
                          >
                            <Star 
                              className={`h-3 w-3 ${
                                i < Math.floor(averageRating) 
                                  ? "text-yellow-400 fill-current" 
                                  : "text-gray-300"
                              }`} 
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{totalReviews} reviews</p>
                  </div>
                  <motion.div 
                    className="p-3 bg-yellow-100 rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Star className="h-6 w-6 text-yellow-600" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Interactive Skill Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Your Skill Badges
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const badges = ["Hair Styling Expert", "Customer Favorite", "5-Star Provider"];
                  const randomBadge = badges[Math.floor(Math.random() * badges.length)];
                  createSkillBadgeMutation.mutate({
                    professionalId: professional.id,
                    badgeName: randomBadge,
                    badgeType: "achievement",
                    iconName: "trophy",
                    color: "yellow",
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Earn Badge
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                  {skillBadges.map((badge: any) => {
                    const IconComponent = skillBadgeConfigs[badge.badgeType as keyof typeof skillBadgeConfigs]?.icon || Award;
                    const colorClass = skillBadgeConfigs[badge.badgeType as keyof typeof skillBadgeConfigs]?.color || "bg-gray-500";
                    
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className={`p-1 rounded-full ${colorClass}`}>
                          <IconComponent className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{badge.badgeName}</span>
                        <Badge variant="outline" className="text-xs">
                          {badge.badgeType}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {skillBadges.length === 0 && (
                  <div className="text-center py-6 text-gray-500 w-full">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No skill badges yet. Complete services and earn achievements!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Main Content with New Features */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg">Recent Bookings</CardTitle>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentBookings.length > 0 ? (
                    <div className="space-y-4">
                      {recentBookings.map((booking: any) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.clientName || "Client"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.appointmentDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              ${booking.totalPrice}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No bookings yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notifications */}
              {user && <NotificationCenter userId={user.id} />}
            </div>

            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Business Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {displayName}</p>
                      <p><span className="font-medium">Location:</span> {professional.location}</p>
                      <p><span className="font-medium">Specialties:</span> {professional.specialties?.join(", ") || "None"}</p>
                      <p><span className="font-medium">Price Range:</span> {professional.priceRange || "Not set"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      {professional.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{professional.phone}</span>
                        </div>
                      )}
                      {user?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      {professional.website && (
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 hover:underline">{professional.website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">
                              {booking.clientName || "Client"}
                            </p>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(booking.appointmentDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(booking.appointmentDate).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${booking.totalPrice}</span>
                            </div>
                          </div>
                          {booking.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{booking.notes}"</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Portfolio Management</h3>
                <Button onClick={() => setShowPortfolioUpload(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Add Portfolio Image
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.map((item: any) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group rounded-lg overflow-hidden"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.caption || "Portfolio image"}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <h4 className="font-semibold mb-2">{item.category}</h4>
                        {item.caption && <p className="text-sm">{item.caption}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {portfolio.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No portfolio images yet</h3>
                    <p className="mb-4">Start building your portfolio by adding images of your work</p>
                    <Button onClick={() => setShowPortfolioUpload(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            {professional && <EarningsTracker professionalId={professional.id} />}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Your Services</CardTitle>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                {services.length > 0 ? (
                  <div className="space-y-4">
                    {services.map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold text-primary">${service.price}</span>
                              <Badge variant="outline">{service.category}</Badge>
                            </div>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{service.duration} min</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No services yet</h3>
                    <p className="mb-4">Add your first service to start accepting bookings.</p>
                    <Button className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Service
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {review.clientName || "Anonymous"}
                            </span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating 
                                      ? "fill-current text-yellow-400" 
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p>When clients leave reviews, they'll appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI-Powered Client Matching */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Client Matching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Compatibility Score</span>
                        <Badge className="bg-purple-100 text-purple-800">94% Match</Badge>
                      </div>
                      <Progress value={94} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        Your style perfectly matches clients seeking creative and luxurious services
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Recommended Client Types</h4>
                      {[
                        { type: "Creative Professionals", match: 92, icon: Palette },
                        { type: "Luxury Seekers", match: 88, icon: Crown },
                        { type: "Trend Followers", match: 85, icon: Sparkles }
                      ].map((client) => (
                        <div key={client.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <client.icon className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">{client.type}</span>
                          </div>
                          <Badge variant="outline">{client.match}% match</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mood-Based Service Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                    Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Based on Current Mood: {moodEmojis[selectedMood as keyof typeof moodEmojis].emoji} {moodEmojis[selectedMood as keyof typeof moodEmojis].label}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        AI suggests these services align with your current vibe
                      </p>
                      
                      <div className="space-y-2">
                        {selectedMood === "relaxed" && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Spa Treatments</span>
                              <Badge variant="outline">High Demand</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Gentle Styling</span>
                              <Badge variant="outline">Trending</Badge>
                            </div>
                          </>
                        )}
                        {selectedMood === "energetic" && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Bold Color Changes</span>
                              <Badge variant="outline">High Demand</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Dramatic Cuts</span>
                              <Badge variant="outline">Trending</Badge>
                            </div>
                          </>
                        )}
                        {selectedMood === "creative" && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Artistic Designs</span>
                              <Badge variant="outline">High Demand</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Custom Styling</span>
                              <Badge variant="outline">Trending</Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Button variant="outline" className="w-full">
                        <Rocket className="h-4 w-4 mr-2" />
                        Get More AI Insights
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">+23%</div>
                    <div className="text-sm text-gray-600">Booking Rate Increase</div>
                    <p className="text-xs text-gray-500 mt-1">Compared to last month</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">4.8/5</div>
                    <div className="text-sm text-gray-600">Client Satisfaction</div>
                    <p className="text-xs text-gray-500 mt-1">Above average</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">87%</div>
                    <div className="text-sm text-gray-600">Repeat Clients</div>
                    <p className="text-xs text-gray-500 mt-1">Strong loyalty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Consulting Tab */}
          <TabsContent value="video-consults" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Video Sessions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-blue-600" />
                    Video Consultations
                  </CardTitle>
                  <Button className="gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                </CardHeader>
                <CardContent>
                  {videoConsultations.length > 0 ? (
                    <div className="space-y-4">
                      {videoConsultations.map((session: any) => (
                        <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Video className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Beauty Consultation</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(session.scheduledAt).toLocaleDateString()} at{" "}
                                  {new Date(session.scheduledAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              session.status === "active" ? "bg-green-100 text-green-800" :
                              session.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {session.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{session.duration} minutes</span>
                            <div className="flex space-x-2">
                              {session.status === "scheduled" && (
                                <Button size="sm" variant="outline">
                                  <Play className="h-4 w-4 mr-1" />
                                  Start
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Chat
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No video sessions yet</h3>
                      <p>Start offering video consultations to connect with clients remotely</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-green-600" />
                    Video Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Virtual Consultations</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Connect with clients before their appointment to discuss styles and preferences
                      </p>
                      <Button size="sm" className="w-full">
                        <Video className="h-4 w-4 mr-2" />
                        Enable Video Calls
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Headphones className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">HD Audio & Video</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Globe className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">Screen Sharing</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">Secure Sessions</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                    <p>Detailed analytics and insights will be available here.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Booking Conversion Rate</span>
                      <span className="text-lg font-bold text-gray-900">--</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Average Service Value</span>
                      <span className="text-lg font-bold text-gray-900">
                        ${completedBookings.length > 0 ? (totalRevenue / completedBookings.length).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Client Retention Rate</span>
                      <span className="text-lg font-bold text-gray-900">--</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Portfolio Upload Modal */}
      <AnimatePresence>
        {showPortfolioUpload && professional && (
          <PortfolioUpload
            professionalId={professional.id}
            onClose={() => setShowPortfolioUpload(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
