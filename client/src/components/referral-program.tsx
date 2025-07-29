import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Share2, 
  Users, 
  DollarSign, 
  Gift, 
  Copy, 
  Mail, 
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Link2,
  Award,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface ReferralProgramProps {
  providerId: number;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  referralRate: number;
  topReferrer?: {
    name: string;
    referrals: number;
    earnings: number;
  };
}

interface ReferralLink {
  id: string;
  url: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

interface Referral {
  id: string;
  referrerName: string;
  referredName: string;
  status: 'pending' | 'completed' | 'expired';
  bookingDate: string;
  commission: number;
  createdAt: string;
}

export default function ReferralProgram({ providerId }: ReferralProgramProps) {
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'social'>('link');
  const [emailAddresses, setEmailAddresses] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch referral statistics
  const { data: referralStats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/providers", providerId, "referral-stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch referral links
  const { data: referralLinks = [], isLoading: linksLoading } = useQuery<ReferralLink[]>({
    queryKey: ["/api/providers", providerId, "referral-links"],
  });

  // Fetch referral history
  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/providers", providerId, "referrals"],
  });

  // Generate referral link
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/providers/${providerId}/referral-link`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Referral Link Generated",
        description: "Your unique referral link is ready to share!",
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "referral-links"]
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate referral links",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Link Generation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Send referral invitations
  const sendInvitationsMutation = useMutation({
    mutationFn: async (data: { emails: string[]; message: string }) => {
      const response = await apiRequest("POST", `/api/providers/${providerId}/send-referral-invites`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitations Sent",
        description: "Your referral invitations have been sent successfully!",
      });
      
      setEmailAddresses('');
      setCustomMessage('');
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Invitations",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Referral link copied successfully!",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string, link?: string) => {
    if (!link) return;
    
    const message = "Check out this amazing beauty provider I found on Byootify!";
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`,
      instagram: link, // Instagram doesn't support direct sharing URLs
    };
    
    if (platform === 'instagram') {
      copyToClipboard(link);
      toast({
        title: "Link Copied",
        description: "Paste this link in your Instagram story or post!",
      });
    } else {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    }
  };

  const handleSendInvitations = () => {
    const emails = emailAddresses.split(',').map(email => email.trim()).filter(email => email);
    
    if (emails.length === 0) {
      toast({
        title: "No Email Addresses",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    sendInvitationsMutation.mutate({
      emails,
      message: customMessage || "I'd love to recommend this amazing beauty provider to you!"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (statsLoading || linksLoading || referralsLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Referral Program</h1>
        <p className="text-gray-600">
          Earn rewards by referring new clients to your services
        </p>
      </div>

      {/* Referral Statistics */}
      {referralStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {referralStats.totalReferrals}
                </div>
                <div className="text-sm text-gray-600">Total Referrals</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {referralStats.completedReferrals}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {referralStats.referralRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${referralStats.totalEarnings.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Referral Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Referral Link
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Generate Link Section */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium mb-1">Referral Link</h3>
              <p className="text-sm text-gray-600">
                Share this link to earn commission on new client bookings
              </p>
            </div>
            
            <Button 
              onClick={() => generateLinkMutation.mutate()}
              disabled={generateLinkMutation.isPending}
              className="bg-secondary hover:bg-secondary/90"
            >
              {generateLinkMutation.isPending ? "Generating..." : "Generate Link"}
            </Button>
          </div>

          {/* Active Referral Links */}
          {referralLinks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Your Active Links</h4>
              
              {referralLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-medium">Referral Link</span>
                      <Badge variant="outline">{link.clicks} clicks</Badge>
                      <Badge variant="outline">{link.conversions} conversions</Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{link.url}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(link.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-secondary hover:bg-secondary/90">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Share Your Referral Link</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Social Media Sharing */}
                          <div>
                            <h4 className="font-medium mb-3">Share on Social Media</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <Button
                                variant="outline"
                                onClick={() => shareToSocial('facebook', link.url)}
                                className="flex items-center gap-2"
                              >
                                <Facebook className="h-4 w-4 text-blue-600" />
                                Facebook
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => shareToSocial('twitter', link.url)}
                                className="flex items-center gap-2"
                              >
                                <Twitter className="h-4 w-4 text-blue-500" />
                                Twitter
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => shareToSocial('instagram', link.url)}
                                className="flex items-center gap-2"
                              >
                                <Instagram className="h-4 w-4 text-pink-600" />
                                Instagram
                              </Button>
                            </div>
                          </div>

                          {/* Email Sharing */}
                          <div>
                            <h4 className="font-medium mb-3">Send via Email</h4>
                            <div className="space-y-3">
                              <Input
                                placeholder="Enter email addresses (comma separated)"
                                value={emailAddresses}
                                onChange={(e) => setEmailAddresses(e.target.value)}
                              />
                              <Button
                                onClick={handleSendInvitations}
                                disabled={sendInvitationsMutation.isPending}
                                className="w-full bg-secondary hover:bg-secondary/90"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                {sendInvitationsMutation.isPending ? "Sending..." : "Send Invitations"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
              <p className="text-gray-600">Start sharing your referral link to earn commissions!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-secondary/10 rounded-full">
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{referral.referredName}</h4>
                        <Badge className={getStatusColor(referral.status)}>
                          {referral.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Referred by {referral.referrerName} • 
                        {referral.status === 'completed' 
                          ? ` Booked on ${format(new Date(referral.bookingDate), 'MMM d, yyyy')}`
                          : ` Added ${format(new Date(referral.createdAt), 'MMM d, yyyy')}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${
                      referral.status === 'completed' 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }`}>
                      ${referral.commission.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">commission</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Share2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">1. Share Your Link</h3>
              <p className="text-sm text-gray-600">
                Generate and share your unique referral link with friends and family
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">2. They Book Services</h3>
              <p className="text-sm text-gray-600">
                When someone books through your link, they become your referral
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2">3. Earn Commission</h3>
              <p className="text-sm text-gray-600">
                Receive 10% commission on their first booking automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}