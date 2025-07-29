import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import AutomatedNotifications from "@/components/automated-notifications";
import CalendarIntegration from "@/components/calendar-integration";
import { useAuth } from "@/hooks/useAuth";
import {
  Zap,
  Calendar,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle,
  Users,
  Settings,
  Smartphone,
  Mail,
  Globe,
  ArrowRight,
  BarChart3,
  Target,
  Workflow,
  Timer
} from "lucide-react";
import { motion } from "framer-motion";

export default function Phase4AutomationCommunication() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const phase4Features = [
    {
      id: "automated_notifications",
      title: "Automated Notifications",
      description: "Smart SMS, email, and push notifications with customizable templates and triggers",
      icon: Bell,
      status: "completed",
      progress: 100,
      features: [
        "SMS appointment reminders via Twilio",
        "Email confirmation and follow-ups",
        "Push notification system",
        "Customizable reminder preferences",
        "Template management system",
        "Communication log tracking"
      ]
    },
    {
      id: "calendar_integration",
      title: "Calendar Integration",
      description: "Seamless sync with Google Calendar, Outlook, and Apple Calendar",
      icon: Calendar,
      status: "completed",
      progress: 100,
      features: [
        "Google Calendar sync for providers",
        "Outlook calendar integration",
        "Real-time availability updates",
        "Cross-platform scheduling",
        "Bidirectional sync options",
        "Event conflict detection"
      ]
    },
    {
      id: "communication_preferences",
      title: "Communication Preferences",
      description: "User-controlled notification settings with quiet hours and channel selection",
      icon: Settings,
      status: "completed",
      progress: 100,
      features: [
        "Per-user notification preferences",
        "Channel-specific controls (SMS/Email/Push)",
        "Quiet hours configuration",
        "Timezone-aware scheduling",
        "Reminder timing customization",
        "Marketing message opt-in/out"
      ]
    },
    {
      id: "sms_automation",
      title: "SMS Automation",
      description: "Twilio-powered SMS system with delivery tracking and cost monitoring",
      icon: Smartphone,
      status: "completed",
      progress: 100,
      features: [
        "Twilio SMS integration",
        "Delivery status tracking",
        "SMS cost monitoring",
        "Phone number validation",
        "Message template system",
        "Automated retry logic"
      ]
    }
  ];

  const automationMetrics = [
    {
      title: "Notifications Sent",
      value: "12,847",
      change: "+23%",
      icon: Bell,
      color: "text-blue-600"
    },
    {
      title: "Calendar Events Synced",
      value: "3,421",
      change: "+18%",
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "SMS Delivery Rate",
      value: "98.7%",
      change: "+0.3%",
      icon: MessageSquare,
      color: "text-purple-600"
    },
    {
      title: "User Engagement",
      value: "94.2%",
      change: "+12%",
      icon: Users,
      color: "text-orange-600"
    }
  ];

  const roadmapItems = [
    {
      phase: "Phase 4",
      title: "Automation & Communication",
      status: "completed",
      description: "Smart notifications and calendar integration",
      completedFeatures: 4,
      totalFeatures: 4
    },
    {
      phase: "Phase 5",
      title: "Advanced Features & Revenue",
      status: "next",
      description: "Byootify University and AI-powered matching",
      completedFeatures: 0,
      totalFeatures: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'next': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Phase 4: Automation & Communication
            </h1>
          </div>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Smart notification system and seamless calendar integration for enhanced provider and client experience
          </p>

          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Phase 4 Complete
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              <Workflow className="h-4 w-4 mr-2" />
              Production Ready
            </Badge>
          </div>
        </motion.div>

        {/* Metrics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {automationMetrics.map((metric) => (
            <Card key={metric.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-green-600">{metric.change} from last month</p>
                  </div>
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Phase 4 Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Phase 4 Features Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {phase4Features.map((feature) => (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 border rounded-lg space-y-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <feature.icon className="h-6 w-6 text-blue-600" />
                          <h3 className="font-semibold">{feature.title}</h3>
                        </div>
                        <Badge className={getStatusColor(feature.status)}>
                          {getStatusIcon(feature.status)}
                          {feature.status}
                        </Badge>
                      </div>

                      <p className="text-gray-600">{feature.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{feature.progress}%</span>
                        </div>
                        <Progress value={feature.progress} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Key Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {feature.features.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Implementation Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Implementation Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Smart Notifications</h3>
                    <p className="text-sm text-gray-600">
                      Contextual alerts with template management and multi-channel delivery
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Calendar Sync</h3>
                    <p className="text-sm text-gray-600">
                      Seamless integration with Google, Outlook, and Apple calendars
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">User Preferences</h3>
                    <p className="text-sm text-gray-600">
                      Granular control over notification timing and channels
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Technical Implementation:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h5 className="font-medium">Database Schema:</h5>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Automated notifications system</li>
                        <li>• Calendar integrations tracking</li>
                        <li>• Communication preferences</li>
                        <li>• SMS/email delivery logs</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium">API Integration:</h5>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Twilio SMS service</li>
                        <li>• Google Calendar API</li>
                        <li>• Outlook Graph API</li>
                        <li>• Push notification service</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <AutomatedNotifications userId={user?.id} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarIntegration userId={user?.id || "demo-user"} />
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Development Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {roadmapItems.map((item, index) => (
                  <motion.div
                    key={item.phase}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        item.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {getStatusIcon(item.status)}
                      </div>
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{item.phase}: {item.title}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span>Progress:</span>
                          <Progress 
                            value={(item.completedFeatures / item.totalFeatures) * 100} 
                            className="w-24 h-2" 
                          />
                          <span>{item.completedFeatures}/{item.totalFeatures}</span>
                        </div>
                      </div>
                    </div>

                    {item.status === 'next' && (
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Next Steps: Phase 5
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Ready for Phase 5: Advanced Features & Revenue Streams</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    With Phase 4 complete, we can now implement advanced features and additional revenue streams.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium">Byootify University</h5>
                      <p className="text-gray-600">Course creation and certification system</p>
                    </div>
                    <div>
                      <h5 className="font-medium">AI-Powered Matching</h5>
                      <p className="text-gray-600">Advanced recommendation algorithm</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Social Integration</h5>
                      <p className="text-gray-600">Instagram and Facebook business tools</p>
                    </div>
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