import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Coins, Zap, TrendingUp, MapPin, Clock, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface TokenManagementProps {
  professionalId: number;
}

const TokenPurchaseForm = ({ professionalId }: { professionalId: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/provider-dashboard',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tokens Purchased!",
          description: "Your tokens have been added to your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Something went wrong with your payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full mt-4"
      >
        {isProcessing ? "Processing..." : "Purchase Tokens"}
      </Button>
    </form>
  );
};

export function TokenManagement({ professionalId }: TokenManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [boostForm, setBoostForm] = useState({
    boostType: '',
    duration: 1,
    geoLocation: ''
  });

  // Fetch token information
  const { data: tokenData, isLoading } = useQuery({
    queryKey: [`/api/providers/${professionalId}/tokens`],
    retry: false,
  });

  // Token purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: { tokenPackage: string }) => {
      const response = await apiRequest('POST', `/api/providers/${professionalId}/tokens/purchase`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPurchaseDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Boost activation mutation
  const boostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/providers/${professionalId}/tokens/boost`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Boost Activated!",
        description: `Your ${boostForm.boostType} boost is now active for ${boostForm.duration} hours.`,
      });
      setBoostDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${professionalId}/tokens`] });
    },
    onError: (error: any) => {
      toast({
        title: "Boost Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (packageType: string) => {
    setSelectedPackage(packageType);
    purchaseMutation.mutate({ tokenPackage: packageType });
  };

  const handleBoost = () => {
    boostMutation.mutate(boostForm);
  };

  const tokenPackages = [
    { id: 'basic', name: 'Basic Pack', tokens: 100, price: 10, description: 'Perfect for occasional boosts' },
    { id: 'standard', name: 'Standard Pack', tokens: 500, price: 40, description: 'Great value for regular users', popular: true },
    { id: 'premium', name: 'Premium Pack', tokens: 1000, price: 75, description: 'Best for power users', discount: '25% off' }
  ];

  const boostTypes = [
    { id: 'local', name: 'Local Boost', cost: 5, description: 'Featured in your immediate area' },
    { id: 'city', name: 'City Boost', cost: 10, description: 'Featured across your city' },
    { id: 'state', name: 'State Boost', cost: 20, description: 'Featured statewide' }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Token Balance
          </CardTitle>
          <CardDescription>
            Use tokens to boost your visibility and get more bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">
                {(tokenData as any)?.availableTokens || 0}
              </div>
              <div className="text-sm text-gray-600">Available Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">
                {(tokenData as any)?.totalPurchased || 0}
              </div>
              <div className="text-sm text-gray-600">Total Purchased</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">
                {(tokenData as any)?.totalUsed || 0}
              </div>
              <div className="text-sm text-gray-600">Tokens Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">Purchase Tokens</TabsTrigger>
          <TabsTrigger value="boost">Activate Boost</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tokenPackages.map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                {pkg.discount && (
                  <Badge className="absolute -top-2 right-4 bg-green-500">
                    {pkg.discount}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold">{pkg.tokens}</div>
                    <div className="text-sm text-gray-600">Tokens</div>
                    <div className="text-2xl font-bold text-green-600">${pkg.price}</div>
                    <Button 
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchaseMutation.isPending}
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="boost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Boost Your Visibility
              </CardTitle>
              <CardDescription>
                Use tokens to appear at the top of search results and get more exposure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {boostTypes.map((boost) => (
                  <Card key={boost.id} className="cursor-pointer hover:border-orange-500 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {boost.name}
                      </CardTitle>
                      <CardDescription>{boost.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                          {boost.cost} tokens/hour
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Activate Boost
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Activate Visibility Boost</DialogTitle>
                    <DialogDescription>
                      Choose your boost settings to increase your visibility
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="boostType">Boost Type</Label>
                      <Select 
                        value={boostForm.boostType} 
                        onValueChange={(value) => setBoostForm(prev => ({ ...prev, boostType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select boost type" />
                        </SelectTrigger>
                        <SelectContent>
                          {boostTypes.map((boost) => (
                            <SelectItem key={boost.id} value={boost.id}>
                              {boost.name} - {boost.cost} tokens/hour
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (hours)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="24"
                        value={boostForm.duration}
                        onChange={(e) => setBoostForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Target Location</Label>
                      <Input
                        id="location"
                        placeholder="Enter city, zip code, or area"
                        value={boostForm.geoLocation}
                        onChange={(e) => setBoostForm(prev => ({ ...prev, geoLocation: e.target.value }))}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium">Cost Summary:</div>
                      <div className="text-lg font-bold">
                        {boostForm.boostType && (boostTypes.find(b => b.id === boostForm.boostType)?.cost || 0) * boostForm.duration} tokens
                      </div>
                    </div>

                    <Button 
                      onClick={handleBoost}
                      disabled={!boostForm.boostType || boostMutation.isPending}
                      className="w-full"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {boostMutation.isPending ? 'Activating...' : 'Activate Boost'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Token Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Purchasing {selectedPackage} token package
            </DialogDescription>
          </DialogHeader>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <TokenPurchaseForm professionalId={professionalId} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}