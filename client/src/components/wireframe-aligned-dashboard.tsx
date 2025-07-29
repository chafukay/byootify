import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  TrendingUp, 
  Target, 
  Users, 
  Star, 
  Calendar, 
  DollarSign,
  Shield,
  Award,
  Zap,
  Clock,
  MapPin,
  Phone,
  Mail,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Coins,
  Trophy,
  Sparkles,
  UserCheck,
  Camera,
  CreditCard
} from "lucide-react";
import { motion } from "framer-motion";

interface WireframeAlignedDashboardProps {
  providerId: number;
}

interface TokenDashboard {
  tokens: {
    tokenBalance: number;
    totalTokensPurchased: number;
    tokensUsed: number;
    pointsEarned: number;
    achievementLevel: string;
  };
  activeBoosts: Array<{
    id: number;
    boostType: string;
    remainingTime: number;
    impressions: number;
    clicks: number;
  }>;
  trustScore: {
    overallScore: number;
  };
  nextAchievement: {
    level: string;
    name: string;
    points: number;
    reward?: string;
  };
}

interface VerificationData {
  verifications: Array<{
    id: number;
    verificationType: string;
    verificationStatus: string;
    documentName?: string;
    verifiedAt?: string;
  }>;
  references: Array<{
    id: number;
    referenceName: string;
    referenceEmail: string;
    relationship: string;
    verificationStatus: string;
    rating?: number;
  }>;
  trustScore: {
    overallScore: number;
    backgroundCheckPassed: boolean;
    stateIdVerified: boolean;
    certificationsVerified: boolean;
    referencesVerified: boolean;
    workspacePhotosUploaded: boolean;
  };
  completionPercentage: number;
}

export default function WireframeAlignedDashboard({ providerId }: WireframeAlignedDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [newVerification, setNewVerification] = useState({
    verificationType: "",
    documentName: "",
    documentUrl: ""
  });
  const [newReference, setNewReference] = useState({
    referenceName: "",
    referenceEmail: "",
    referencePhone: "",
    relationship: "",
    yearsKnown: 1
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch token dashboard data per wireframes
  const { data: tokenData, isLoading: tokenLoading } = useQuery<TokenDashboard>({
    queryKey: ["/api/providers", providerId, "tokens/dashboard"],
    refetchInterval: 60000, // Update every minute
  });

  // Fetch verification data per wireframes
  const { data: verificationData, isLoading: verificationLoading } = useQuery<VerificationData>({
    queryKey: ["/api/providers", providerId, "verifications"],
    refetchInterval: 300000, // Update every 5 minutes
  });

  // Add verification mutation
  const addVerificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/providers/${providerId}/verifications`, data);
    },
    onSuccess: () => {
      toast({
        title: "Verification Added",
        description: "Your verification document has been submitted for review",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", providerId, "verifications"] });
      setNewVerification({ verificationType: "", documentName: "", documentUrl: "" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add verification",
        variant: "destructive",
      });
    },
  });

  // Add reference mutation
  const addReferenceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/providers/${providerId}/references`, data);
    },
    onSuccess: () => {
      toast({
        title: "Reference Added",
        description: "Professional reference has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", providerId, "verifications"] });
      setNewReference({
        referenceName: "",
        referenceEmail: "",
        referencePhone: "",
        relationship: "",
        yearsKnown: 1
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1000);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add reference",
        variant: "destructive",
      });
    },
  });

  const getAchievementColor = (level: string) => {
    const colors = {
      bronze: "text-yellow-600",
      silver: "text-gray-400", 
      gold: "text-yellow-500",
      platinum: "text-purple-500"
    };
    return colors[level as keyof typeof colors] || "text-gray-400";
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  if (tokenLoading || verificationLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your business growth and verification status</p>
        </div>
        <Badge 
          variant="secondary" 
          className={`text-lg px-4 py-2 ${getAchievementColor(tokenData?.tokens.achievementLevel || 'bronze')}`}
        >
          <Trophy className="h-5 w-5 mr-2" />
          {tokenData?.tokens.achievementLevel?.toUpperCase() || 'BRONZE'} Provider
        </Badge>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Token Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tokenData?.tokens.tokenBalance || 0}
                  </p>
                </div>
                <Coins className="h-8 w-8 text-yellow-500" />
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
                  <p className="text-sm font-medium text-gray-600">Trust Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {verificationData?.trustScore.overallScore?.toFixed(1) || '5.0'}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
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
                  <p className="text-sm font-medium text-gray-600">Active Boosts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tokenData?.activeBoosts?.length || 0}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verification</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {verificationData?.completionPercentage || 0}%
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tokens">Token System</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievement Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievement Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Progress to {tokenData?.nextAchievement?.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {tokenData?.tokens.pointsEarned || 0} / {tokenData?.nextAchievement?.points} points
                  </span>
                </div>
                <Progress 
                  value={((tokenData?.tokens.pointsEarned || 0) / (tokenData?.nextAchievement?.points || 100)) * 100} 
                  className="w-full" 
                />
                {tokenData?.nextAchievement?.reward && (
                  <p className="text-sm text-gray-600">
                    Reward: {tokenData.nextAchievement.reward}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Active Boosts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Active Visibility Boosts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tokenData?.activeBoosts?.length ? (
                  <div className="space-y-3">
                    {tokenData.activeBoosts.map((boost, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{boost.boostType} Boost</p>
                          <p className="text-sm text-gray-600">
                            {Math.floor(boost.remainingTime / 60)}h {boost.remainingTime % 60}m remaining
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{boost.impressions} views</p>
                          <p className="text-sm text-gray-600">{boost.clicks} clicks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No active boosts. Purchase tokens to boost your visibility!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Token System Tab */}
        <TabsContent value="tokens" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Token Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {tokenData?.tokens.tokenBalance || 0}
                    </p>
                    <p className="text-sm text-gray-600">Available</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {tokenData?.tokens.totalTokensPurchased || 0}
                    </p>
                    <p className="text-sm text-gray-600">Purchased</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {tokenData?.tokens.tokensUsed || 0}
                    </p>
                    <p className="text-sm text-gray-600">Used</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="w-full" size="lg">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase More Tokens
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Boost</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Local Boost (10 tokens/hr)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  City Boost (25 tokens/hr)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="h-4 w-4 mr-2" />
                  State Boost (50 tokens/hr)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Progress</span>
                  <span className="text-sm text-gray-600">
                    {verificationData?.completionPercentage || 0}%
                  </span>
                </div>
                <Progress value={verificationData?.completionPercentage || 0} className="w-full" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {verificationData?.trustScore.stateIdVerified ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    }
                    <span className="text-sm">State ID Verification</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {verificationData?.trustScore.backgroundCheckPassed ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    }
                    <span className="text-sm">Background Check</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {verificationData?.trustScore.certificationsVerified ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    }
                    <span className="text-sm">Professional Certifications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {verificationData?.trustScore.referencesVerified ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    }
                    <span className="text-sm">Professional References (2 required)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {verificationData?.trustScore.workspacePhotosUploaded ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> : 
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    }
                    <span className="text-sm">Workspace Photos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Add Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Verification Document</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="verificationType">Document Type</Label>
                          <Select
                            value={newVerification.verificationType}
                            onValueChange={(value) => setNewVerification({ ...newVerification, verificationType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="state_id">State ID</SelectItem>
                              <SelectItem value="background_check">Background Check</SelectItem>
                              <SelectItem value="certification">Professional Certification</SelectItem>
                              <SelectItem value="license">Professional License</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="documentName">Document Name</Label>
                          <Input
                            id="documentName"
                            value={newVerification.documentName}
                            onChange={(e) => setNewVerification({ ...newVerification, documentName: e.target.value })}
                            placeholder="e.g., Cosmetology License"
                          />
                        </div>
                        <div>
                          <Label htmlFor="documentUrl">Document URL</Label>
                          <Input
                            id="documentUrl"
                            value={newVerification.documentUrl}
                            onChange={(e) => setNewVerification({ ...newVerification, documentUrl: e.target.value })}
                            placeholder="Upload document and paste URL"
                          />
                        </div>
                        <Button
                          onClick={() => addVerificationMutation.mutate(newVerification)}
                          disabled={addVerificationMutation.isPending}
                          className="w-full"
                        >
                          {addVerificationMutation.isPending ? "Submitting..." : "Submit Document"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Add Reference
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Professional Reference</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="referenceName">Reference Name</Label>
                          <Input
                            id="referenceName"
                            value={newReference.referenceName}
                            onChange={(e) => setNewReference({ ...newReference, referenceName: e.target.value })}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="referenceEmail">Email</Label>
                          <Input
                            id="referenceEmail"
                            type="email"
                            value={newReference.referenceEmail}
                            onChange={(e) => setNewReference({ ...newReference, referenceEmail: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="referencePhone">Phone (Optional)</Label>
                          <Input
                            id="referencePhone"
                            value={newReference.referencePhone}
                            onChange={(e) => setNewReference({ ...newReference, referencePhone: e.target.value })}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="relationship">Relationship</Label>
                          <Select
                            value={newReference.relationship}
                            onValueChange={(value) => setNewReference({ ...newReference, relationship: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="former_client">Former Client</SelectItem>
                              <SelectItem value="colleague">Colleague</SelectItem>
                              <SelectItem value="employer">Former Employer</SelectItem>
                              <SelectItem value="mentor">Mentor/Trainer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="yearsKnown">Years Known</Label>
                          <Input
                            id="yearsKnown"
                            type="number"
                            min="1"
                            value={newReference.yearsKnown}
                            onChange={(e) => setNewReference({ ...newReference, yearsKnown: parseInt(e.target.value) })}
                          />
                        </div>
                        <Button
                          onClick={() => addReferenceMutation.mutate(newReference)}
                          disabled={addReferenceMutation.isPending}
                          className="w-full"
                        >
                          {addReferenceMutation.isPending ? "Adding..." : "Add Reference"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="w-full justify-start">
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Workspace Photos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Verifications */}
          <Card>
            <CardHeader>
              <CardTitle>Current Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verificationData?.verifications?.length ? (
                  verificationData.verifications.map((verification) => (
                    <div key={verification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getVerificationIcon(verification.verificationStatus)}
                        <div>
                          <p className="font-medium capitalize">
                            {verification.verificationType.replace('_', ' ')}
                          </p>
                          {verification.documentName && (
                            <p className="text-sm text-gray-600">{verification.documentName}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={verification.verificationStatus === 'approved' ? 'default' : 'secondary'}>
                        {verification.verificationStatus}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No verifications yet. Add your first document to get started!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current References */}
          <Card>
            <CardHeader>
              <CardTitle>Professional References</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verificationData?.references?.length ? (
                  verificationData.references.map((reference) => (
                    <div key={reference.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{reference.referenceName}</p>
                        <p className="text-sm text-gray-600">
                          {reference.referenceEmail} • {reference.relationship.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reference.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{reference.rating}</span>
                          </div>
                        )}
                        <Badge variant={reference.verificationStatus === 'approved' ? 'default' : 'secondary'}>
                          {reference.verificationStatus}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No references yet. Add 2 professional references to complete verification.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}