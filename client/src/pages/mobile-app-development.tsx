import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/navigation";
import { 
  Smartphone, Tablet, Download, Star, Users, TrendingUp,
  Play, Apple, Settings, Shield, Zap, Heart, Clock, CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface MobileFeature {
  id: string;
  name: string;
  description: string;
  status: "planned" | "development" | "testing" | "completed";
  priority: "high" | "medium" | "low";
  estimatedCompletion: string;
}

interface AppStore {
  name: string;
  icon: any;
  status: "pending" | "review" | "approved" | "live";
  url?: string;
  downloads?: number;
  rating?: number;
}

export default function MobileAppDevelopment() {
  const [selectedPlatform, setSelectedPlatform] = useState<"ios" | "android" | "both">("both");

  const mobileFeatures: MobileFeature[] = [
    {
      id: "core-booking",
      name: "Core Booking System",
      description: "Complete booking flow optimized for mobile touch interactions",
      status: "completed",
      priority: "high",
      estimatedCompletion: "2025-08-01"
    },
    {
      id: "push-notifications",
      name: "Push Notifications",
      description: "Real-time notifications for bookings, messages, and updates",
      status: "development",
      priority: "high",
      estimatedCompletion: "2025-08-15"
    },
    {
      id: "offline-mode",
      name: "Offline Mode",
      description: "Core functionality available without internet connection",
      status: "planned",
      priority: "medium",
      estimatedCompletion: "2025-09-01"
    },
    {
      id: "biometric-auth",
      name: "Biometric Authentication",
      description: "Fingerprint and Face ID login for enhanced security",
      status: "development",
      priority: "high",
      estimatedCompletion: "2025-08-20"
    },
    {
      id: "location-services",
      name: "Location Services",
      description: "GPS integration for provider discovery and directions",
      status: "testing",
      priority: "high",
      estimatedCompletion: "2025-08-10"
    },
    {
      id: "camera-integration",
      name: "Camera Integration",
      description: "Photo capture for portfolio uploads and consultation",
      status: "completed",
      priority: "medium",
      estimatedCompletion: "2025-08-05"
    },
    {
      id: "payment-wallet",
      name: "Mobile Payment Wallet",
      description: "Apple Pay, Google Pay, and in-app payment integration",
      status: "development",
      priority: "high",
      estimatedCompletion: "2025-08-25"
    },
    {
      id: "ar-features",
      name: "AR Beauty Try-On",
      description: "Augmented reality features for style preview",
      status: "planned",
      priority: "low",
      estimatedCompletion: "2025-10-01"
    }
  ];

  const appStores: AppStore[] = [
    {
      name: "Apple App Store",
      icon: Apple,
      status: "pending",
      url: "https://apps.apple.com/app/byootify",
      downloads: 0,
      rating: 0
    },
    {
      name: "Google Play Store", 
      icon: Play,
      status: "pending",
      url: "https://play.google.com/store/apps/details?id=com.byootify",
      downloads: 0,
      rating: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "testing": return "text-blue-600";
      case "development": return "text-yellow-600";
      case "planned": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "testing":
        return <Badge className="bg-blue-100 text-blue-800">Testing</Badge>;
      case "development":
        return <Badge className="bg-yellow-100 text-yellow-800">Development</Badge>;
      case "planned":
        return <Badge variant="outline">Planned</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const completedFeatures = mobileFeatures.filter(f => f.status === "completed").length;
  const totalFeatures = mobileFeatures.length;
  const developmentProgress = Math.round((completedFeatures / totalFeatures) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smartphone className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">Mobile App Development</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Native iOS and Android apps bringing the full Byootify experience to mobile devices.
            Enhanced with mobile-specific features like push notifications, offline mode, and biometric authentication.
          </p>
        </div>

        {/* Development Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Development Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {developmentProgress}%
                </div>
                <div className="text-sm text-gray-600">Overall Progress</div>
                <Progress value={developmentProgress} className="mt-2" />
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {completedFeatures}/{totalFeatures}
                </div>
                <div className="text-sm text-gray-600">Features Complete</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  Q3 2025
                </div>
                <div className="text-sm text-gray-600">Target Release</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Target Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button 
                variant={selectedPlatform === "ios" ? "default" : "outline"}
                onClick={() => setSelectedPlatform("ios")}
                className="flex items-center gap-2"
              >
                <Apple className="h-4 w-4" />
                iOS App
              </Button>
              <Button 
                variant={selectedPlatform === "android" ? "default" : "outline"}
                onClick={() => setSelectedPlatform("android")}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Android App
              </Button>
              <Button 
                variant={selectedPlatform === "both" ? "default" : "outline"}
                onClick={() => setSelectedPlatform("both")}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Both Platforms
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appStores.map((store, index) => (
                <motion.div
                  key={store.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <store.icon className="h-8 w-8 text-gray-700" />
                    <div>
                      <h4 className="font-semibold">{store.name}</h4>
                      <Badge variant={store.status === "live" ? "default" : "secondary"}>
                        {store.status === "pending" ? "Pending Submission" : 
                         store.status === "review" ? "Under Review" :
                         store.status === "approved" ? "Approved" : "Live"}
                      </Badge>
                    </div>
                  </div>
                  
                  {store.status === "live" && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Downloads</div>
                        <div className="font-semibold">{store.downloads?.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Rating</div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{store.rating}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {store.status === "pending" && (
                    <div className="text-sm text-gray-600">
                      App submission planned for August 2025
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Development Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Feature Development Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mobileFeatures.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {feature.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : feature.status === "testing" ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : feature.status === "development" ? (
                          <Zap className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                          {getStatusBadge(feature.status)}
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(feature.priority)}
                          >
                            {feature.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                        <div className="text-xs text-gray-500">
                          Target completion: {new Date(feature.estimatedCompletion).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Native App Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Native App Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Better Performance</h4>
                <p className="text-sm text-gray-600">
                  Native apps provide faster loading times and smoother animations
                </p>
              </div>
              
              <div className="text-center p-4">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Enhanced Security</h4>
                <p className="text-sm text-gray-600">
                  Biometric authentication and secure local storage
                </p>
              </div>
              
              <div className="text-center p-4">
                <Download className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Offline Access</h4>
                <p className="text-sm text-gray-600">
                  Core features available without internet connection
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mt-6">
              <h4 className="font-semibold text-blue-900 mb-2">Current Status: Web App Optimized</h4>
              <p className="text-sm text-blue-800 mb-3">
                While native apps are in development, our current web application is fully optimized for mobile devices 
                with responsive design, touch interactions, and Progressive Web App (PWA) features.
              </p>
              <div className="text-xs text-blue-700">
                <strong>Available Now:</strong> Full mobile web experience at byootify.replit.app<br />
                <strong>Coming Soon:</strong> Native iOS and Android apps with enhanced mobile features
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}