import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import ProviderPayoutDashboard from "@/components/provider-payout-dashboard";
import TipProcessing from "@/components/tip-processing";
import DisputeManagement from "@/components/dispute-management";
import { 
  CreditCard,
  DollarSign,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Star,
  TrendingUp,
  ArrowRight,
  Banknote,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function Phase3PaymentPayout() {
  const { user, isAuthenticated } = useAuth();
  const [activeDemo, setActiveDemo] = useState<'payout' | 'tips' | 'disputes' | null>(null);

  // Demo data
  const demoBookingId = "booking_demo_12345";
  const demoProviderId = 1;
  const demoProviderName = "Sarah Johnson";
  const demoServiceAmount = 85.00;

  const features = [
    {
      id: "provider-payouts",
      title: "Provider Payout System",
      description: "Automated next-day deposits with comprehensive fee management",
      icon: CreditCard,
      status: "completed",
      benefits: [
        "Next-day deposit automation",
        "Payout schedule management",
        "Fee deduction and reporting",
        "Payment method management",
        "Stripe Connect integration"
      ]
    },
    {
      id: "tip-processing",
      title: "Tip Processing System",
      description: "In-app tipping during checkout with instant distribution",
      icon: Banknote,
      status: "completed",
      benefits: [
        "In-app tipping during checkout",
        "Tip distribution to providers",
        "Tip reporting and analytics",
        "Instant payment processing",
        "Provider earnings tracking"
      ]
    },
    {
      id: "dispute-management",
      title: "Dispute Management System",
      description: "Complete dispute resolution workflow with admin controls",
      icon: Shield,
      status: "completed",
      benefits: [
        "Dispute filing interface",
        "Admin dispute resolution workflow",
        "Refund processing automation",
        "Resolution tracking",
        "Communication system"
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <CreditCard className="h-12 w-12 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Phase 3: Payment & Payout Infrastructure
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete payment processing ecosystem with automated payouts, tip management, and dispute resolution
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge className="bg-green-100 text-green-800">
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
              <TrendingUp className="h-5 w-5" />
              Phase 3 Development Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">3/3</div>
                <div className="text-sm text-gray-600">Features Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-gray-600">Payment Infrastructure</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">Automated</div>
                <div className="text-sm text-gray-600">Payout Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">Ready</div>
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
                      <feature.icon className="h-5 w-5 text-green-600" />
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
                    <h4 className="font-medium text-gray-900">Key Features:</h4>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {feature.id === "provider-payouts" && (
                    <Button
                      onClick={() => setActiveDemo(activeDemo === 'payout' ? null : 'payout')}
                      className="w-full"
                      variant={activeDemo === 'payout' ? 'default' : 'outline'}
                    >
                      {activeDemo === 'payout' ? 'Hide Demo' : 'View Payout Dashboard'}
                    </Button>
                  )}

                  {feature.id === "tip-processing" && (
                    <Button
                      onClick={() => setActiveDemo(activeDemo === 'tips' ? null : 'tips')}
                      className="w-full"
                      variant={activeDemo === 'tips' ? 'default' : 'outline'}
                    >
                      {activeDemo === 'tips' ? 'Hide Demo' : 'Try Tip Processing'}
                    </Button>
                  )}

                  {feature.id === "dispute-management" && (
                    <Button
                      onClick={() => setActiveDemo(activeDemo === 'disputes' ? null : 'disputes')}
                      className="w-full"
                      variant={activeDemo === 'disputes' ? 'default' : 'outline'}
                    >
                      {activeDemo === 'disputes' ? 'Hide Demo' : 'Open Dispute Center'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Demo Sections */}
        {activeDemo === 'payout' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Provider Payout Dashboard Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProviderPayoutDashboard providerId={demoProviderId} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeDemo === 'tips' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Tip Processing Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TipProcessing
                  bookingId={demoBookingId}
                  providerId={demoProviderId}
                  providerName={demoProviderName}
                  serviceAmount={demoServiceAmount}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeDemo === 'disputes' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Dispute Management Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisputeManagement 
                  bookingId={demoBookingId}
                  userId={user?.id}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Technical Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Technical Implementation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="architecture" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="architecture">Architecture</TabsTrigger>
                <TabsTrigger value="payments">Payment Flow</TabsTrigger>
                <TabsTrigger value="database">Database</TabsTrigger>
              </TabsList>
              
              <TabsContent value="architecture" className="space-y-4">
                <h3 className="text-lg font-semibold">System Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Payout System</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Automated payout scheduling</li>
                      <li>• Stripe Connect integration</li>
                      <li>• Fee calculation engine</li>
                      <li>• Next-day deposit processing</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Tip Processing</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Real-time tip collection</li>
                      <li>• Instant provider distribution</li>
                      <li>• Analytics and reporting</li>
                      <li>• Payment intent creation</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Dispute Resolution</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Structured dispute workflow</li>
                      <li>• Automated refund processing</li>
                      <li>• Admin resolution tools</li>
                      <li>• Communication tracking</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="payments" className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Processing Flow</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Revenue Model</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• 15% commission on completed jobs</li>
                          <li>• 10% service fee collection</li>
                          <li>• 25% reservation hold fee</li>
                          <li>• 15% cancellation fee to provider</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Payout Schedule</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Daily, weekly, or monthly payouts</li>
                          <li>• Minimum payout thresholds</li>
                          <li>• Automated fee deductions</li>
                          <li>• Instant tip distribution</li>
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
                        <li>• provider_payouts</li>
                        <li>• tips</li>
                        <li>• disputes</li>
                        <li>• dispute_messages</li>
                        <li>• payout_schedules</li>
                        <li>• payment_details</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Automated payout calculations</li>
                        <li>• Stripe integration tracking</li>
                        <li>• Dispute workflow management</li>
                        <li>• Commission and fee tracking</li>
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
              Phase 3 Complete - Ready for Phase 4
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Phase 3 Payment & Payout Infrastructure is now complete and ready for production. 
                The platform now includes comprehensive payment processing, automated payouts, and dispute resolution.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-800">Provider Payouts</Badge>
                <Badge className="bg-green-100 text-green-800">Tip Processing</Badge>
                <Badge className="bg-green-100 text-green-800">Dispute Management</Badge>
                <Badge className="bg-blue-100 text-blue-800">Production Ready</Badge>
              </div>

              <div className="pt-4">
                <h4 className="font-medium mb-2">Next: Phase 4 - Automation & Communication</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automated SMS appointment reminders</li>
                  <li>• Email confirmation and follow-ups</li>
                  <li>• Push notification system</li>
                  <li>• Calendar integration (Google/Outlook)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}