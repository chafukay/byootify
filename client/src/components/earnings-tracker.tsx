import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Award, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Earnings } from "@shared/schema";

interface EarningsData extends Earnings {
  bookingDate: string;
  clientName: string;
  serviceName: string;
}

interface EarningsTrackerProps {
  professionalId: number;
}

export default function EarningsTracker({ professionalId }: EarningsTrackerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  const { data: earnings = [], isLoading } = useQuery<EarningsData[]>({
    queryKey: ["/api/providers", professionalId, "earnings", selectedPeriod],
  });

  const { data: earningsStats } = useQuery({
    queryKey: ["/api/providers", professionalId, "earnings", "stats", selectedPeriod],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = earnings.reduce((sum, earning) => sum + parseFloat(earning.netAmount), 0);
  const totalFees = earnings.reduce((sum, earning) => sum + parseFloat(earning.platformFee), 0);
  const averagePerBooking = earnings.length > 0 ? totalEarnings / earnings.length : 0;

  const growthPercentage = earningsStats?.growthPercentage || 0;
  const isPositiveGrowth = growthPercentage >= 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Earnings Overview</h3>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalEarnings.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isPositiveGrowth ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isPositiveGrowth ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
              <div className="flex items-center mt-2">
                <span className={`text-sm ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositiveGrowth ? '+' : ''}{growthPercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last {selectedPeriod}</span>
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
                  <p className="text-sm text-gray-600">Platform Fees</p>
                  <p className="text-2xl font-bold text-gray-700">
                    ${totalFees.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {earnings.length} transactions
              </p>
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
                  <p className="text-sm text-gray-600">Avg per Booking</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${averagePerBooking.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Per completed service
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No earnings for this period</p>
              <p className="text-sm">Complete some bookings to see your earnings here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.slice(0, 10).map((earning, index) => (
                <motion.div
                  key={earning.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{earning.serviceName}</p>
                      <p className="text-sm text-gray-600">
                        {earning.clientName} • {new Date(earning.bookingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +${parseFloat(earning.netAmount).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={earning.payoutStatus === 'paid' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {earning.payoutStatus}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}