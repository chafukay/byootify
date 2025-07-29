import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenManagement } from '@/components/token-management';
import { JobRequestSystem } from '@/components/job-request-system';
import { ProviderVerification } from '@/components/provider-verification';
import { useAuth } from '@/hooks/useAuth';
import { 
  Coins, 
  Briefcase, 
  Shield, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Award,
  Home,
  MessageSquare,
  Star,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function Phase1MVP() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch provider data if authenticated
  const { data: providerData } = useQuery({
    queryKey: ['/api/professionals/me'],
    enabled: isAuthenticated,
    retry: false,
  });

  const mvpFeatures = [
    {
      id: 'token-system',
      title: 'Token-Based Visibility System',
      description: 'Purchase tokens to boost your listings and appear at the top of searches',
      icon: Coins,
      status: 'live',
      benefits: [
        'Local, city, and state-wide boosts available',
        'Token packages starting at $10 for 100 tokens',
        'Instant visibility improvement',
        'Real-time boost activation'
      ]
    },
    {
      id: 'commission-fees',
      title: 'Commission & Fee Structure',
      description: 'Transparent fee structure with 15% commission and automated calculations',
      icon: DollarSign,
      status: 'live',
      benefits: [
        '15% commission on completed jobs',
        '25% reservation hold fee',
        '10% service fee',
        'Next-day provider payouts'
      ]
    },
    {
      id: 'job-marketplace',
      title: 'Job Request Marketplace',
      description: 'Clients post jobs and providers can bid competitively',
      icon: Briefcase,
      status: 'live',
      benefits: [
        'Browse and bid on client job requests',
        'Set your own pricing and availability',
        'Direct client communication',
        'Home visit options available'
      ]
    },
    {
      id: 'verification',
      title: 'Provider Verification System',
      description: 'Build trust through certification uploads and professional references',
      icon: Shield,
      status: 'live',
      benefits: [
        'Upload professional certifications',
        'Add verified references',
        'Increase booking rates',
        'Build client trust'
      ]
    },
    {
      id: 'enhanced-booking',
      title: 'Enhanced Booking with Home Visits',
      description: 'Advanced booking system with home visit options and recurring appointments',
      icon: Home,
      status: 'live',
      benefits: [
        'Home visit availability toggle',
        'Recurring appointment scheduling',
        'Automatic fee calculations',
        'Enhanced client experience'
      ]
    }
  ];

  const upcomingFeatures = [
    {
      title: 'Anonymous Communication System',
      description: 'Secure messaging without exposing personal information',
      icon: MessageSquare,
      phase: 'Phase 2',
      timeline: '1-2 weeks'
    },
    {
      title: 'Two-Factor Authentication',
      description: 'Enhanced security for provider and client accounts',
      icon: Shield,
      phase: 'Phase 2',
      timeline: '1-2 weeks'
    },
    {
      title: 'Automated SMS Reminders',
      description: 'Twilio integration for appointment reminders',
      icon: Clock,
      phase: 'Phase 4',
      timeline: '3-4 weeks'
    },
    {
      title: 'Byootify University',
      description: 'Course creation and certification tracking',
      icon: Award,
      phase: 'Phase 5',
      timeline: '5-6 weeks'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'beta':
        return 'bg-blue-100 text-blue-800';
      case 'coming-soon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <CheckCircle className="h-4 w-4" />;
      case 'beta':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Byootify Phase 1 MVP
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete business model infrastructure with token-based visibility, 
            commission structure, job marketplace, and provider verification system.
          </p>
          <div className="flex justify-center gap-4">
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              All Phase 1 Features Live
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              15% Commission Model Active
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Token System</TabsTrigger>
            <TabsTrigger value="jobs">Job Marketplace</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* MVP Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mvpFeatures.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={feature.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className="h-8 w-8 text-blue-500" />
                        <Badge className={`flex items-center gap-1 ${getStatusColor(feature.status)}`}>
                          {getStatusIcon(feature.status)}
                          {feature.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full mt-4" 
                        onClick={() => {
                          switch (feature.id) {
                            case 'token-system':
                              setActiveTab('tokens');
                              break;
                            case 'job-marketplace':
                              setActiveTab('jobs');
                              break;
                            case 'verification':
                              setActiveTab('verification');
                              break;
                            default:
                              break;
                          }
                        }}
                      >
                        Explore Feature
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Business Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Business Model Impact
                </CardTitle>
                <CardDescription>
                  How Phase 1 MVP features drive revenue and growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">15%</div>
                    <div className="text-sm text-gray-600">Commission Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">25%</div>
                    <div className="text-sm text-gray-600">Hold Fee Structure</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">$10-75</div>
                    <div className="text-sm text-gray-600">Token Packages</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">Next Day</div>
                    <div className="text-sm text-gray-600">Provider Payouts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Token System Tab */}
          <TabsContent value="tokens" className="space-y-6">
            {isAuthenticated && providerData ? (
              <TokenManagement professionalId={providerData.id} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Token System Available for Providers
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    The token-based visibility system allows providers to boost their listings 
                    and appear at the top of search results.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-lg font-bold text-yellow-500">Basic</div>
                      <div className="text-2xl font-bold">100 tokens</div>
                      <div className="text-sm text-gray-600">$10.00</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <div className="text-lg font-bold text-blue-500">Standard</div>
                      <div className="text-2xl font-bold">500 tokens</div>
                      <div className="text-sm text-gray-600">$40.00</div>
                      <Badge className="mt-1">Most Popular</Badge>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-lg font-bold text-purple-500">Premium</div>
                      <div className="text-2xl font-bold">1000 tokens</div>
                      <div className="text-sm text-gray-600">$75.00</div>
                      <Badge variant="secondary" className="mt-1">25% off</Badge>
                    </div>
                  </div>
                  <Button className="mt-6" asChild>
                    <a href="/api/login">Login as Provider to Access</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Job Marketplace Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <JobRequestSystem />
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            {isAuthenticated && providerData ? (
              <ProviderVerification professionalId={providerData.id} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Provider Verification System
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Build trust with clients by verifying your credentials and professional references.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                    <div className="text-center">
                      <Award className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium">Certifications</h4>
                      <p className="text-sm text-gray-600">Upload professional licenses and certificates</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium">References</h4>
                      <p className="text-sm text-gray-600">Add verified professional references</p>
                    </div>
                  </div>
                  <Button className="mt-6" asChild>
                    <a href="/api/login">Login as Provider to Verify</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phase 1 Complete */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    Phase 1 - Complete ✅
                  </CardTitle>
                  <CardDescription>Core Business Model Infrastructure</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Token-based visibility system
                    </li>
                    <li className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      15% commission structure
                    </li>
                    <li className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Job request marketplace
                    </li>
                    <li className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Provider verification system
                    </li>
                    <li className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Enhanced booking with home visits
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Upcoming Phases */}
              <div className="space-y-4">
                {upcomingFeatures.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <Card key={index} className="border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <IconComponent className="h-6 w-6 text-blue-500 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{feature.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {feature.phase}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>Timeline: {feature.timeline}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Development Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Complete Development Timeline</CardTitle>
                <CardDescription>5-phase roadmap spanning 6-8 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h4 className="font-medium text-green-800">Phase 1: Core Business Model (Complete)</h4>
                      <p className="text-sm text-green-600">Token system, commission structure, job marketplace</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-blue-800">Phase 2: Trust & Safety (1-2 weeks)</h4>
                      <p className="text-sm text-blue-600">Anonymous communication, 2FA, background checks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Phase 3: Payment Infrastructure (1 week)</h4>
                      <p className="text-sm text-yellow-600">Automated payouts, tip processing, dispute management</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-purple-500" />
                    <div>
                      <h4 className="font-medium text-purple-800">Phase 4: Automation (1 week)</h4>
                      <p className="text-sm text-purple-600">SMS reminders, calendar integration, notifications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-gray-500" />
                    <div>
                      <h4 className="font-medium text-gray-800">Phase 5: Advanced Features (1-2 weeks)</h4>
                      <p className="text-sm text-gray-600">Byootify University, AI matching, social integration</p>
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