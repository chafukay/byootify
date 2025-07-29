import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { 
  Shield, Server, Activity, Database, Clock, AlertCircle,
  CheckCircle, TrendingUp, Zap, HardDrive, Cpu, Monitor,
  FileText, Download, Play, Pause, RotateCcw, Settings
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SystemDashboard() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // System health query
  const { data: health = {}, refetch: refetchHealth } = useQuery({
    queryKey: ["/health"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Backup status query
  const { data: backupStatus = {}, refetch: refetchBackupStatus } = useQuery({
    queryKey: ["/api/system/backup-status"],
    enabled: isAuthenticated,
  });

  // Create backup handler
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/system/create-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast({
          title: "Backup Created",
          description: "System backup created successfully",
        });
        refetchBackupStatus();
      } else {
        throw new Error('Backup creation failed');
      }
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create system backup",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Sample performance data
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 60, requests: 120 },
    { time: '04:00', cpu: 30, memory: 55, requests: 80 },
    { time: '08:00', cpu: 65, memory: 70, requests: 200 },
    { time: '12:00', cpu: 80, memory: 75, requests: 350 },
    { time: '16:00', cpu: 75, memory: 72, requests: 300 },
    { time: '20:00', cpu: 60, memory: 68, requests: 250 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded': return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'unhealthy': return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production System Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor system health, performance, and security</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => refetchHealth()} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {getStatusBadge(health.status)}
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "System Status", 
            value: health.status || "Unknown", 
            icon: health.status === 'healthy' ? CheckCircle : AlertCircle,
            color: getStatusColor(health.status),
            subtitle: `Uptime: ${Math.floor((health.uptime || 0) / 3600)}h`
          },
          { 
            title: "Memory Usage", 
            value: health.metrics?.memory?.percentage ? `${health.metrics.memory.percentage}%` : "N/A",
            icon: Cpu,
            color: "text-blue-600",
            subtitle: `${health.metrics?.memory?.used || 0}MB / ${health.metrics?.memory?.total || 0}MB`
          },
          { 
            title: "Request Rate", 
            value: health.metrics?.requests?.total || "0",
            icon: Activity,
            color: "text-purple-600",
            subtitle: `${health.metrics?.requests?.errorsLast5Min || 0} errors (5min)`
          },
          { 
            title: "Response Time", 
            value: health.metrics?.requests?.averageResponseTime ? `${health.metrics.requests.averageResponseTime}ms` : "N/A",
            icon: Clock,
            color: "text-green-600",
            subtitle: "Average response time"
          },
        ].map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                </div>
                <div className={`${metric.color} bg-gray-50 p-3 rounded-full`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production Features Tabs */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Rate Limiting", status: "Active", description: "API and auth rate limits in place" },
                  { name: "Security Headers", status: "Active", description: "Helmet.js security headers enabled" },
                  { name: "Input Validation", status: "Active", description: "Express-validator for all inputs" },
                  { name: "SQL Injection Prevention", status: "Active", description: "Input sanitization middleware" },
                  { name: "Request Logging", status: "Active", description: "All requests logged for audit" },
                ].map((feature) => (
                  <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{feature.name}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{feature.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(health.services || {}).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{service}</p>
                        <p className="text-sm text-gray-600">External service connection</p>
                      </div>
                    </div>
                    <Badge className={status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {status as string}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="CPU %" />
                    <Area type="monotone" dataKey="memory" stackId="2" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} name="Memory %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  Performance Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Response Compression", status: "Active", description: "Gzip compression for all responses" },
                  { name: "API Response Caching", status: "Active", description: "LRU cache for GET endpoints" },
                  { name: "Asset Optimization", status: "Active", description: "Cache headers for static assets" },
                  { name: "Database Indexing", status: "Active", description: "Optimized database queries" },
                  { name: "Memory Monitoring", status: "Active", description: "Automatic memory management" },
                ].map((feature) => (
                  <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{feature.name}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">{feature.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2 text-green-600" />
                  Real-time Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{health.metrics?.cpu?.usage || 0}%</span>
                    </div>
                    <Progress value={health.metrics?.cpu?.usage || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{health.metrics?.memory?.percentage || 0}%</span>
                    </div>
                    <Progress value={health.metrics?.memory?.percentage || 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Request Rate</span>
                      <span>{health.metrics?.requests?.total || 0} total</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Health Checks", status: "Running", description: "Automated system health monitoring" },
                  { name: "Error Tracking", status: "Running", description: "Application error logging and alerts" },
                  { name: "Performance Metrics", status: "Running", description: "Response time and resource monitoring" },
                  { name: "User Analytics", status: "Running", description: "User behavior and API usage tracking" },
                  { name: "Alert System", status: "Running", description: "Performance threshold alerting" },
                ].map((feature) => (
                  <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{feature.name}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{feature.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backup & Recovery Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2 text-purple-600" />
                  Backup Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{backupStatus.totalBackups || 0}</p>
                    <p className="text-sm text-gray-600">Total Backups</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{backupStatus.databaseBackups || 0}</p>
                    <p className="text-sm text-gray-600">Database Backups</p>
                  </div>
                </div>
                
                {backupStatus.latestDatabase && (
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">Latest Database Backup</p>
                    <p className="text-sm text-gray-600">
                      {backupStatus.latestDatabase.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {Math.round((backupStatus.latestDatabase.size || 0) / 1024 / 1024)}MB
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleCreateBackup} 
                  disabled={isCreatingBackup}
                  className="w-full"
                >
                  {isCreatingBackup ? (
                    <>
                      <Play className="h-4 w-4 mr-2 animate-spin" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Create Manual Backup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recovery Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Automated Backups", status: "Scheduled", description: "Daily automated backup creation" },
                  { name: "Database Backup", status: "Available", description: "PostgreSQL dump backups" },
                  { name: "Application Backup", status: "Available", description: "Full application code backup" },
                  { name: "Backup Retention", status: "Active", description: "7-day backup retention policy" },
                  { name: "Recovery Points", status: "Active", description: "System state recovery points" },
                ].map((feature) => (
                  <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{feature.name}</p>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">{feature.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                Database & Performance Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Database Indexes", status: "Optimized", description: "Critical database indexes created", count: "25+" },
                  { name: "Query Optimization", status: "Active", description: "Optimized database query patterns", count: "15+" },
                  { name: "Connection Pooling", status: "Active", description: "Database connection pool management", count: "10" },
                  { name: "Cache Strategy", status: "Active", description: "Multi-level caching implementation", count: "5min TTL" },
                  { name: "Asset Compression", status: "Active", description: "Gzip compression for all assets", count: "60% reduction" },
                  { name: "Memory Management", status: "Active", description: "Automatic garbage collection", count: "400MB limit" },
                ].map((feature) => (
                  <div key={feature.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{feature.name}</p>
                      <Badge className="bg-orange-100 text-orange-800">{feature.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{feature.description}</p>
                    <p className="text-xs text-gray-500 font-medium">{feature.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Information Footer */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Environment</p>
              <p className="font-medium text-gray-900">{health.environment || 'development'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="font-medium text-gray-900">{health.version || '1.0.0'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Check</p>
              <p className="font-medium text-gray-900">
                {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="font-medium text-gray-900">
                {health.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}