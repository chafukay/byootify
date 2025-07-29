import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import AnonymousCommunication from "@/components/anonymous-communication";
import TwoFactorAuth from "@/components/two-factor-auth";
import { 
  Shield, 
  MessageCircle, 
  Key,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Lock,
  Eye,
  Phone,
  Mail,
  Star
} from "lucide-react";
import { motion } from "framer-motion";

export default function Phase2TrustSafety() {
  const { user, isAuthenticated } = useAuth();
  const [activeDemo, setActiveDemo] = useState<'communication' | '2fa' | null>(null);

  // Demo data for anonymous communication
  const demoChannelCode = "anon_demo_12345";

  const features = [
    {
      id: "anonymous-communication",
      title: "Anonymous Communication System",
      description: "Secure messaging without exposing personal information",
      icon: MessageCircle,
      status: "completed",
      benefits: [
        "Random email routing for privacy",
        "Anonymous phone number masking", 
        "Secure messaging without personal info exposure",
        "Communication history tracking",
        "Contact reveal request system"
      ]
    },
    {
      id: "two-factor-auth",
      title: "Two-Factor Authentication",
      description: "Enhanced account security with SMS and email verification",
      icon: Key,
      status: "completed",
      benefits: [
        "SMS-based 2FA for providers and clients",
        "Email backup verification",
        "Backup codes for account recovery",
        "Account security enhancement",
        "Protection against unauthorized access"
      ]
    },
    {
      id: "provider-verification",
      title: "Enhanced Provider Verification",
      description: "Comprehensive background and certification checks",
      icon: Shield,
      status: "completed",
      benefits: [
        "Certification upload and verification",
        "Background check integration",
        "State ID verification process",
        "Professional reference system",
        "Trust score calculation"
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Phase 2: Trust & Safety Features
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced security features ensuring safe communication and verified provider profiles
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              High Priority
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              Completed
            </Badge>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Phase 2 Development Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">3/3</div>
                <div className="text-sm text-gray-600">Features Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-600">Trust & Safety</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">Ready</div>
                <div className="text-sm text-gray-600">Production Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-5 w-5 text-blue-600" />
                      {feature.title}
                    </div>
                    {getStatusIcon(feature.status)}
                  </CardTitle>
                  <Badge className={getStatusColor(feature.status)}>
                    {feature.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{feature.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {feature.id === "anonymous-communication" && (
                    <Button
                      onClick={() => setActiveDemo(activeDemo === 'communication' ? null : 'communication')}
                      className="w-full"
                      variant={activeDemo === 'communication' ? 'default' : 'outline'}
                    >
                      {activeDemo === 'communication' ? 'Hide Demo' : 'Try Anonymous Chat'}
                    </Button>
                  )}

                  {feature.id === "two-factor-auth" && isAuthenticated && (
                    <Button
                      onClick={() => setActiveDemo(activeDemo === '2fa' ? null : '2fa')}
                      className="w-full"
                      variant={activeDemo === '2fa' ? 'default' : 'outline'}
                    >
                      {activeDemo === '2fa' ? 'Hide Setup' : 'Setup 2FA'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Demo Sections */}
        {activeDemo === 'communication' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Anonymous Communication Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnonymousCommunication
                  channelCode={demoChannelCode}
                  userType="client"
                  userId={user?.id || "demo-user"}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeDemo === '2fa' && isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TwoFactorAuth userId={user.id} />
          </motion.div>
        )}

        {/* Technical Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Technical Implementation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="architecture" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="architecture">Architecture</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="database">Database</TabsTrigger>
              </TabsList>
              
              <TabsContent value="architecture" className="space-y-4">
                <h3 className="text-lg font-semibold">System Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Anonymous Communication</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Channel-based messaging system</li>
                      <li>• Encrypted message storage</li>
                      <li>• Temporary channel codes</li>
                      <li>• Contact reveal requests</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• SMS and email verification</li>
                      <li>• Backup code generation</li>
                      <li>• Time-based code expiration</li>
                      <li>• Secure token management</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <h3 className="text-lg font-semibold">Security Features</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Privacy Protection</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Anonymous communication channels</li>
                          <li>• Personal information masking</li>
                          <li>• Secure message encryption</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Authentication</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Multi-factor authentication</li>
                          <li>• Backup code recovery</li>
                          <li>• Session security</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="database" className="space-y-4">
                <h3 className="text-lg font-semibold">Database Schema</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">New Tables Added:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• anonymous_channels</li>
                        <li>• anonymous_messages</li>
                        <li>• communication_history</li>
                        <li>• two_factor_auth</li>
                        <li>• verification_codes</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Temporary channel expiration</li>
                        <li>• Message encryption support</li>
                        <li>• Code verification tracking</li>
                        <li>• Backup code storage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Phase 2 Complete - Ready for Phase 3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Phase 2 Trust & Safety features are now complete and ready for production. 
                The platform now includes comprehensive privacy protection and security measures.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-800">Anonymous Communication</Badge>
                <Badge className="bg-green-100 text-green-800">Two-Factor Authentication</Badge>
                <Badge className="bg-green-100 text-green-800">Provider Verification</Badge>
                <Badge className="bg-blue-100 text-blue-800">Production Ready</Badge>
              </div>

              <div className="pt-4">
                <h4 className="font-medium mb-2">Next: Phase 3 - Payment & Payout Infrastructure</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Provider payout system with next-day deposits</li>
                  <li>• In-app tipping during checkout</li>
                  <li>• Dispute management system</li>
                  <li>• Automated fee processing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}