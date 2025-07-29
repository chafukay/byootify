import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Coins, 
  TrendingUp, 
  MapPin, 
  Globe, 
  Clock,
  CreditCard,
  Zap,
  CheckCircle
} from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface TokenPackage {
  id: number;
  name: string;
  tokenAmount: number;
  price: number;
  boostType: string;
  boostDuration: number;
  description: string;
  isPopular: boolean;
}

interface ProviderTokens {
  tokenBalance: number;
  totalTokensPurchased: number;
  tokensUsed: number;
  pointsEarned: number;
  achievementLevel: string;
}

interface ActiveBoost {
  id: number;
  boostType: string;
  duration: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  tokensCost: number;
}

// Payment Form Component
function TokenPurchaseForm({ packageData, onSuccess }: { packageData: TokenPackage; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/professional-dashboard',
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        // Notify backend of successful payment
        await apiRequest('POST', '/api/tokens/purchase/success', {
          paymentIntentId: paymentIntent.id
        });
        
        toast({
          title: "Purchase Successful!",
          description: `${packageData.tokenAmount} tokens added to your account.`,
        });
        
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Purchase ${packageData.tokenAmount} Tokens`}
      </Button>
    </form>
  );
}

// Main Component
export default function EnhancedTokenManagement({ providerId }: { providerId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Fetch token data
  const { data: tokens } = useQuery<ProviderTokens>({
    queryKey: ['/api/providers/tokens', providerId],
    retry: false,
  });

  const { data: packages = [] } = useQuery<TokenPackage[]>({
    queryKey: ['/api/tokens/packages'],
    retry: false,
  });

  const { data: activeBoosts = [] } = useQuery<ActiveBoost[]>({
    queryKey: ['/api/providers/boosts', providerId],
    retry: false,
  });

  // Purchase token package mutation
  const purchaseMutation = useMutation({
    mutationFn: async (packageId: number) => {
      const response = await apiRequest('POST', '/api/tokens/purchase', { packageId });
      return response;
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPurchaseModal(true);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Activate boost mutation
  const activateBoostMutation = useMutation({
    mutationFn: async ({ boostType, duration }: { boostType: string; duration: number }) => {
      return await apiRequest('POST', '/api/tokens/boost/activate', { boostType, duration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/providers/tokens', providerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/providers/boosts', providerId] });
      toast({
        title: "Boost Activated!",
        description: "Your visibility boost is now active.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    purchaseMutation.mutate(pkg.id);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    setClientSecret("");
    setSelectedPackage(null);
    queryClient.invalidateQueries({ queryKey: ['/api/providers/tokens', providerId] });
  };

  const getBoostIcon = (type: string) => {
    switch (type) {
      case 'local': return <MapPin className="h-4 w-4" />;
      case 'city': return <TrendingUp className="h-4 w-4" />;
      case 'state': return <Globe className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getAchievementColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Token Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Token Balance</p>
                <p className="text-2xl font-bold text-blue-600">{tokens?.tokenBalance || 0}</p>
              </div>
              <Coins className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchased</p>
                <p className="text-2xl font-bold text-green-600">{tokens?.totalTokensPurchased || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tokens Used</p>
                <p className="text-2xl font-bold text-purple-600">{tokens?.tokensUsed || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievement Level</p>
                <Badge className={getAchievementColor(tokens?.achievementLevel || 'bronze')}>
                  {tokens?.achievementLevel?.toUpperCase() || 'BRONZE'}
                </Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Boosts */}
      {activeBoosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Active Visibility Boosts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBoosts.map((boost) => (
                <div key={boost.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getBoostIcon(boost.boostType)}
                      <span className="font-medium capitalize">{boost.boostType} Boost</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      <span>{boost.duration} days remaining</span>
                    </div>
                    <div>Cost: {boost.tokensCost} tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Token Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`border rounded-lg p-6 relative ${pkg.isPopular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                {pkg.isPopular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{pkg.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${(pkg.price / 100).toFixed(0)}</span>
                    <span className="text-gray-600">/package</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-blue-600">{pkg.tokenAmount}</span>
                    <span className="text-gray-600"> tokens</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-600 text-center">{pkg.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Boost Type:</span>
                      <Badge variant="outline" className="capitalize">{pkg.boostType}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Boost Duration:</span>
                      <span>{pkg.boostDuration} hours</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6"
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? 'Processing...' : 'Purchase Now'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Boost Activation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Boost Activation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: 'local', name: 'Local Boost', cost: { 1: 5, 3: 12, 7: 25 }, icon: MapPin },
              { type: 'city', name: 'City Boost', cost: { 1: 10, 3: 25, 7: 50 }, icon: TrendingUp },
              { type: 'state', name: 'State Boost', cost: { 1: 20, 3: 50, 7: 100 }, icon: Globe }
            ].map((boostOption) => (
              <div key={boostOption.type} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <boostOption.icon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{boostOption.name}</span>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(boostOption.cost).map(([days, cost]) => (
                    <div key={days} className="flex items-center justify-between">
                      <span className="text-sm">{days} day{parseInt(days) > 1 ? 's' : ''}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => activateBoostMutation.mutate({ 
                          boostType: boostOption.type, 
                          duration: parseInt(days) 
                        })}
                        disabled={!tokens || tokens.tokenBalance < cost || activateBoostMutation.isPending}
                      >
                        {cost} tokens
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPurchaseModal && clientSecret && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Complete Purchase</h3>
            <p className="text-gray-600 mb-4">
              Purchasing {selectedPackage.tokenAmount} tokens for ${(selectedPackage.price / 100).toFixed(2)}
            </p>
            
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <TokenPurchaseForm 
                packageData={selectedPackage} 
                onSuccess={handlePurchaseSuccess}
              />
            </Elements>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setShowPurchaseModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}