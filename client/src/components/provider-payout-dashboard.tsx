import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Settings,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface ProviderPayoutDashboardProps {
  providerId: number;
}

export default function ProviderPayoutDashboard({ providerId }: ProviderPayoutDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payoutSettings, setPayoutSettings] = useState({
    frequency: "daily",
    minimumAmount: 25.00,
    stripeAccountId: "",
    bankAccountLast4: ""
  });

  // Fetch payout data
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: [`/api/providers/${providerId}/payouts`],
  });

  const { data: payoutSchedule } = useQuery({
    queryKey: [`/api/providers/${providerId}/payout-schedule`],
  });

  const { data: tips } = useQuery({
    queryKey: [`/api/providers/${providerId}/tips`],
  });

  // Update payout schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      return apiRequest("POST", `/api/providers/${providerId}/payout-schedule`, scheduleData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payout schedule updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${providerId}/payout-schedule`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payout schedule",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate totals
  const totalEarnings = payouts?.reduce((sum: number, payout: any) => 
    payout.status === 'completed' ? sum + parseFloat(payout.netAmount) : sum, 0) || 0;
  
  const pendingAmount = payouts?.reduce((sum: number, payout: any) => 
    payout.status === 'pending' ? sum + parseFloat(payout.netAmount) : sum, 0) || 0;

  const totalTips = tips?.reduce((sum: number, tip: any) => 
    tip.status === 'completed' ? sum + parseFloat(tip.amount) : sum, 0) || 0;

  const handleScheduleUpdate = () => {
    updateScheduleMutation.mutate(payoutSettings);
  };

  if (payoutsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalEarnings.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${pendingAmount.toFixed(2)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tips</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${totalTips.toFixed(2)}
                  </p>
                </div>
                <Banknote className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Next Payout</p>
                  <p className="text-sm font-bold text-blue-600">
                    {payoutSchedule?.nextPayoutDate ? 
                      format(new Date(payoutSchedule.nextPayoutDate), 'MMM dd') : 
                      'Not scheduled'
                    }
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payout History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts && payouts.length > 0 ? (
                  payouts.map((payout: any) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(payout.status)}
                        <div>
                          <p className="font-medium">
                            {format(new Date(payout.payoutDate), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payout.totalBookings} bookings
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(payout.status)}>
                            {payout.status}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">
                          ${parseFloat(payout.netAmount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Fees: ${parseFloat(payout.fees).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No payouts yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Tips Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tips && tips.length > 0 ? (
                  tips.map((tip: any) => (
                    <div key={tip.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Banknote className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(tip.createdAt), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Booking #{tip.bookingId.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(tip.status)}>
                          {tip.status}
                        </Badge>
                        <p className="font-bold text-lg text-purple-600">
                          +${parseFloat(tip.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tips received yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Payout Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Payout Frequency</Label>
                  <Select 
                    value={payoutSettings.frequency} 
                    onValueChange={(value) => setPayoutSettings(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumAmount">Minimum Payout Amount</Label>
                  <Input
                    id="minimumAmount"
                    type="number"
                    step="0.01"
                    value={payoutSettings.minimumAmount}
                    onChange={(e) => setPayoutSettings(prev => ({ 
                      ...prev, 
                      minimumAmount: parseFloat(e.target.value) 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripeAccount">Stripe Account ID</Label>
                  <Input
                    id="stripeAccount"
                    value={payoutSettings.stripeAccountId}
                    onChange={(e) => setPayoutSettings(prev => ({ 
                      ...prev, 
                      stripeAccountId: e.target.value 
                    }))}
                    placeholder="acct_xxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Bank Account (Last 4)</Label>
                  <Input
                    id="bankAccount"
                    value={payoutSettings.bankAccountLast4}
                    onChange={(e) => setPayoutSettings(prev => ({ 
                      ...prev, 
                      bankAccountLast4: e.target.value 
                    }))}
                    placeholder="****1234"
                    maxLength={4}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Current Schedule</h4>
                  <p className="text-sm text-gray-600">
                    {payoutSchedule ? (
                      `${payoutSchedule.frequency} payouts, minimum $${payoutSchedule.minimumAmount}`
                    ) : (
                      'No schedule configured'
                    )}
                  </p>
                </div>
                <Button 
                  onClick={handleScheduleUpdate}
                  disabled={updateScheduleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  {updateScheduleMutation.isPending ? 'Updating...' : 'Update Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}