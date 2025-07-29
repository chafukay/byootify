import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, DollarSign, Users, Calendar, Star, 
  BarChart3, PieChart, Activity, Target, Award,
  ArrowUpRight, ArrowDownRight, Eye, Clock
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useState } from "react";

export default function AnalyticsDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");
  const [viewType, setViewType] = useState("overview");

  // Analytics queries
  const { data: overview = {} } = useQuery({
    queryKey: ["/api/analytics/overview", timeRange],
    enabled: isAuthenticated,
  });

  const { data: revenueData = [] } = useQuery({
    queryKey: ["/api/analytics/revenue", timeRange],
    enabled: isAuthenticated,
  });

  const { data: bookingsData = [] } = useQuery({
    queryKey: ["/api/analytics/bookings", timeRange],
    enabled: isAuthenticated,
  });

  const { data: performanceMetrics = {} } = useQuery({
    queryKey: ["/api/analytics/performance", timeRange],
    enabled: isAuthenticated,
  });

  const { data: customerInsights = {} } = useQuery({
    queryKey: ["/api/analytics/customers", timeRange],
    enabled: isAuthenticated,
  });

  const { data: topServices = [] } = useQuery({
    queryKey: ["/api/analytics/services", timeRange],
    enabled: isAuthenticated,
  });

  const { data: competitorAnalysis = {} } = useQuery({
    queryKey: ["/api/analytics/competitors", timeRange],
    enabled: isAuthenticated,
  });

  // Sample data for charts
  const revenueChartData = [
    { month: 'Jan', revenue: 12000, bookings: 45, growth: 12 },
    { month: 'Feb', revenue: 15000, bookings: 52, growth: 25 },
    { month: 'Mar', revenue: 18000, bookings: 68, growth: 20 },
    { month: 'Apr', revenue: 22000, bookings: 75, growth: 22 },
    { month: 'May', revenue: 28000, bookings: 89, growth: 27 },
    { month: 'Jun', revenue: 35000, bookings: 102, growth: 25 },
  ];

  const serviceDistribution = [
    { name: 'Hair Styling', value: 35, color: '#8b5cf6' },
    { name: 'Nail Care', value: 25, color: '#ec4899' },
    { name: 'Facial Treatments', value: 20, color: '#06b6d4' },
    { name: 'Massage', value: 15, color: '#10b981' },
    { name: 'Other', value: 5, color: '#f59e0b' },
  ];

  const performanceData = [
    { metric: 'Conversion Rate', value: '68%', change: '+12%', trend: 'up' },
    { metric: 'Avg. Booking Value', value: '$245', change: '+8%', trend: 'up' },
    { metric: 'Customer Retention', value: '84%', change: '-2%', trend: 'down' },
    { metric: 'Response Time', value: '2.3h', change: '-15%', trend: 'up' },
  ];

  const topPerformers = [
    { name: 'Sarah Johnson', category: 'Hair Styling', revenue: '$12,500', rating: 4.9, bookings: 85 },
    { name: 'Michael Chen', category: 'Massage Therapy', revenue: '$10,800', rating: 4.8, bookings: 72 },
    { name: 'Emily Davis', category: 'Nail Care', revenue: '$9,200', rating: 4.9, bookings: 95 },
    { name: 'Jessica Rodriguez', category: 'Facial Care', revenue: '$8,900', rating: 4.7, bookings: 68 },
  ];

  const insightCards = [
    {
      title: "Peak Booking Hours",
      value: "2-6 PM",
      description: "42% of bookings happen during afternoon hours",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Top Customer Segment",
      value: "25-35 years",
      description: "Highest LTV and repeat booking rate",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Popular Service Combo",
      value: "Hair + Nails",
      description: "Most frequently booked together",
      icon: Award,
      color: "text-purple-600"
    },
    {
      title: "Revenue Growth",
      value: "+156%",
      description: "Year-over-year platform growth",
      icon: TrendingUp,
      color: "text-pink-600"
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Analytics Dashboard</h2>
            <p className="text-gray-600 mb-4">
              Sign in to access comprehensive business analytics and insights.
            </p>
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In to View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for data-driven decisions
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Revenue", value: "$156,789", change: "+23%", icon: DollarSign, color: "text-green-600" },
          { title: "Total Bookings", value: "1,247", change: "+18%", icon: Calendar, color: "text-blue-600" },
          { title: "Active Providers", value: "89", change: "+12%", icon: Users, color: "text-purple-600" },
          { title: "Avg Rating", value: "4.8", change: "+0.2", icon: Star, color: "text-yellow-600" },
        ].map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`${metric.color} bg-gray-50 p-3 rounded-full`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">{metric.change}</span>
                <span className="text-sm text-gray-600 ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs value={viewType} onValueChange={setViewType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="competitors">Competition</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Service Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip />
                    <RechartsPieChart data={serviceDistribution}>
                      {serviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {serviceDistribution.map((service) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="text-sm text-gray-600">{service.name}</span>
                      </div>
                      <span className="text-sm font-medium">{service.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {performanceData.map((metric) => (
                  <div key={metric.metric} className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">{metric.metric}</p>
                    <p className="text-2xl font-bold text-gray-900 my-2">{metric.value}</p>
                    <div className="flex items-center justify-center">
                      {metric.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((provider, index) => (
                    <div key={provider.name} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{provider.name}</p>
                        <p className="text-sm text-gray-600">{provider.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{provider.revenue}</p>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600 ml-1">{provider.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#06b6d4" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Rate Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="growth" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insightCards.map((insight) => (
              <Card key={insight.title}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`${insight.color} bg-gray-50 p-3 rounded-full`}>
                      <insight.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{insight.value}</p>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actionable Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Actionable Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Optimize Afternoon Availability",
                    description: "42% of bookings occur between 2-6 PM. Consider incentivizing providers to increase availability during these peak hours.",
                    priority: "High",
                    impact: "Revenue +$15K/month"
                  },
                  {
                    title: "Expand Hair + Nail Combo Packages",
                    description: "This service combination has the highest booking rate. Create specialized packages to increase average order value.",
                    priority: "Medium", 
                    impact: "AOV +$35"
                  },
                  {
                    title: "Target 25-35 Age Group",
                    description: "This demographic shows highest lifetime value and retention. Focus marketing efforts on this segment.",
                    priority: "Medium",
                    impact: "Customer LTV +22%"
                  }
                ].map((insight, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <Badge variant={insight.priority === 'High' ? 'destructive' : 'secondary'}>
                        {insight.priority} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    <p className="text-sm font-medium text-green-600">Potential Impact: {insight.impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competition Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "StyleHub", marketShare: "28%", avgPrice: "$180", rating: "4.3", growth: "-2%" },
                  { name: "BeautyConnect", marketShare: "35%", avgPrice: "$165", rating: "4.1", growth: "+5%" },
                  { name: "Byootify", marketShare: "22%", avgPrice: "$195", rating: "4.8", growth: "+23%" },
                ].map((competitor) => (
                  <Card key={competitor.name} className={competitor.name === 'Byootify' ? 'border-purple-500 bg-purple-50' : ''}>
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold text-lg">{competitor.name}</h4>
                      {competitor.name === 'Byootify' && (
                        <Badge className="mb-2">You</Badge>
                      )}
                      <div className="space-y-2 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">Market Share</p>
                          <p className="text-xl font-bold">{competitor.marketShare}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg Price</p>
                          <p className="text-lg font-medium">{competitor.avgPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rating</p>
                          <p className="text-lg font-medium">{competitor.rating}/5</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">YoY Growth</p>
                          <p className={`text-lg font-medium ${competitor.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {competitor.growth}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}