import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Users, UserCheck, Calendar, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, Shield, Eye, Ban, CheckCircle, XCircle, Search,
  Filter, Activity, BarChart3, PieChart, Clock, Star
} from "lucide-react";
import { motion } from "framer-motion";

export default function SuperAdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserRole, setSelectedUserRole] = useState("all");
  const [selectedModerationStatus, setSelectedModerationStatus] = useState("pending");

  // Redirect if not super admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "You need super admin privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [isAuthenticated, user, toast]);

  // Platform Statistics Query
  const { data: platformStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/platform-stats"],
    enabled: isAuthenticated && user?.role === "super_admin",
  });

  // Users Management Query
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users", searchTerm, selectedUserRole],
    enabled: isAuthenticated && user?.role === "super_admin",
  });

  // Providers Management Query
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["/api/admin/providers"],
    enabled: isAuthenticated && user?.role === "super_admin",
  });

  // Moderation Queue Query
  const { data: moderationQueue = [], isLoading: moderationLoading } = useQuery({
    queryKey: ["/api/admin/moderation-queue", selectedModerationStatus],
    enabled: isAuthenticated && user?.role === "super_admin",
  });

  // Admin Action Logs Query
  const { data: actionLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/action-logs"],
    enabled: isAuthenticated && user?.role === "super_admin",
  });

  // User Action Mutations
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await apiRequest("POST", "/api/admin/users/suspend", { userId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User suspended successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Failed to suspend user", variant: "destructive" });
    },
  });

  const verifyProviderMutation = useMutation({
    mutationFn: async (providerId: number) => {
      await apiRequest("POST", "/api/admin/providers/verify", { providerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      toast({ title: "Provider verified successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Failed to verify provider", variant: "destructive" });
    },
  });

  const moderateContentMutation = useMutation({
    mutationFn: async ({ itemId, action, notes }: { itemId: number; action: string; notes?: string }) => {
      await apiRequest("POST", "/api/admin/moderate-content", { itemId, action, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation-queue"] });
      toast({ title: "Content moderated successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({ title: "Failed to moderate content", variant: "destructive" });
    },
  });

  if (!isAuthenticated || user?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">Super admin privileges required</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Users",
      value: platformStats?.totalUsers || 0,
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "blue"
    },
    {
      title: "Active Providers",
      value: platformStats?.totalProviders || 0,
      change: "+8%",
      trend: "up",
      icon: UserCheck,
      color: "green"
    },
    {
      title: "Total Bookings",
      value: platformStats?.totalBookings || 0,
      change: "+23%",
      trend: "up",
      icon: Calendar,
      color: "purple"
    },
    {
      title: "Platform Revenue",
      value: `$${platformStats?.totalRevenue || 0}`,
      change: "+15%",
      trend: "up",
      icon: DollarSign,
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-600">Platform management and oversight</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          {stat.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                        <IconComponent className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="client">Clients</SelectItem>
                      <SelectItem value="provider">Providers</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usersLoading ? (
                    <div className="text-center py-8">Loading users...</div>
                  ) : users && users.length > 0 ? (
                    users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.profileImageUrl || "/api/placeholder/40/40"}
                            alt={user.firstName || "User"}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <Badge variant={user.role === "super_admin" ? "default" : "outline"}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.isActive ? "default" : "destructive"}>
                            {user.isActive ? "Active" : "Suspended"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {user.isActive && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Ban className="h-4 w-4 mr-1" />
                                  Suspend
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Suspend User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>Are you sure you want to suspend {user.firstName} {user.lastName}?</p>
                                  <Textarea placeholder="Reason for suspension..." />
                                  <Button 
                                    onClick={() => suspendUserMutation.mutate({ userId: user.id, reason: "Admin action" })}
                                    className="w-full"
                                    disabled={suspendUserMutation.isPending}
                                  >
                                    {suspendUserMutation.isPending ? "Suspending..." : "Confirm Suspension"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No users found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Providers Management */}
          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Provider Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providersLoading ? (
                    <div className="text-center py-8">Loading providers...</div>
                  ) : providers && providers.length > 0 ? (
                    providers.map((provider: any) => (
                      <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{provider.businessName}</p>
                            <p className="text-sm text-gray-500">{provider.location}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{provider.rating} ({provider.reviewCount} reviews)</span>
                            </div>
                          </div>
                          <Badge variant={provider.isVerified ? "default" : "outline"}>
                            {provider.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                          <Badge variant={provider.isActive ? "default" : "destructive"}>
                            {provider.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {!provider.isVerified && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => verifyProviderMutation.mutate(provider.id)}
                              disabled={verifyProviderMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {verifyProviderMutation.isPending ? "Verifying..." : "Verify"}
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No providers found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Moderation */}
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Content Moderation Queue
                </CardTitle>
                <Select value={selectedModerationStatus} onValueChange={setSelectedModerationStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moderationLoading ? (
                    <div className="text-center py-8">Loading moderation queue...</div>
                  ) : moderationQueue && moderationQueue.length > 0 ? (
                    moderationQueue.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{item.contentType}</Badge>
                            <Badge variant={item.status === "pending" ? "destructive" : "default"}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="font-medium mb-1">Reason: {item.reason}</p>
                          <p className="text-sm text-gray-500">Reported by: {item.reportedBy || "System"}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {item.status === "pending" && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => moderateContentMutation.mutate({ itemId: item.id, action: "approve" })}
                              disabled={moderateContentMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => moderateContentMutation.mutate({ itemId: item.id, action: "reject" })}
                              disabled={moderateContentMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No items in moderation queue</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Analytics charts would be implemented here
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    User Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    User distribution charts would be implemented here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Logs */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Admin Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logsLoading ? (
                    <div className="text-center py-8">Loading activity logs...</div>
                  ) : actionLogs && actionLogs.length > 0 ? (
                    actionLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-gray-500">
                              {log.targetType} ID: {log.targetId}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">Admin: {log.adminId}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No activity logs found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}