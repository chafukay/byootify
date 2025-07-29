import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, DollarSign, Star, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface TipProcessingProps {
  bookingId: string;
  providerId: number;
  providerName: string;
  serviceAmount: number;
  onTipComplete?: () => void;
}

const TipForm = ({ bookingId, providerId, onTipComplete }: { 
  bookingId: string; 
  providerId: number; 
  onTipComplete?: () => void;
}) => {
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
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
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
          title: "Tip Sent Successfully! 🎉",
          description: "Your tip has been processed and will be included in the provider's next payout.",
        });
        onTipComplete?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process tip payment",
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
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {isProcessing ? 'Processing Tip...' : 'Send Tip'}
      </Button>
    </form>
  );
};

export default function TipProcessing({ 
  bookingId, 
  providerId, 
  providerName, 
  serviceAmount,
  onTipComplete 
}: TipProcessingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const suggestedTips = [
    { percentage: 15, amount: Math.round(serviceAmount * 0.15) },
    { percentage: 18, amount: Math.round(serviceAmount * 0.18) },
    { percentage: 20, amount: Math.round(serviceAmount * 0.20) },
    { percentage: 25, amount: Math.round(serviceAmount * 0.25) },
  ];

  const createTipMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", `/api/bookings/${bookingId}/tip`, { amount });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tip payment",
        variant: "destructive",
      });
    },
  });

  const handleTipAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    createTipMutation.mutate(amount);
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      setSelectedAmount(amount);
      createTipMutation.mutate(amount);
    }
  };

  const handleTipComplete = () => {
    setShowPayment(false);
    setClientSecret(null);
    setSelectedAmount(null);
    setCustomAmount("");
    onTipComplete?.();
  };

  if (showPayment && clientSecret) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Heart className="h-5 w-5 text-pink-600" />
            Complete Your Tip
          </CardTitle>
          <p className="text-center text-gray-600">
            ${selectedAmount?.toFixed(2)} tip for {providerName}
          </p>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <TipForm 
              bookingId={bookingId} 
              providerId={providerId} 
              onTipComplete={handleTipComplete}
            />
          </Elements>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          Show Your Appreciation
        </CardTitle>
        <p className="text-gray-600">
          Tip {providerName} for their excellent service
        </p>
        <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
          <DollarSign className="h-4 w-4" />
          Service amount: ${serviceAmount.toFixed(2)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Suggested Tips */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Tip Options</Label>
          <div className="grid grid-cols-2 gap-3">
            {suggestedTips.map((tip) => (
              <motion.div
                key={tip.percentage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-16 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => handleTipAmountSelect(tip.amount)}
                  disabled={createTipMutation.isPending}
                >
                  <span className="text-lg font-bold">{tip.percentage}%</span>
                  <span className="text-sm text-gray-600">${tip.amount}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Tip */}
        <div className="space-y-3">
          <Label htmlFor="customTip" className="text-sm font-medium">
            Custom Tip Amount
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="customTip"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleCustomTip}
              disabled={!customAmount || parseFloat(customAmount) <= 0 || createTipMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createTipMutation.isPending ? 'Processing...' : 'Tip'}
            </Button>
          </div>
        </div>

        {/* Tip Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Why tip your provider?</h4>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• Show appreciation for exceptional service</li>
                <li>• Support your provider's livelihood</li>
                <li>• Encourage continued excellent service</li>
                <li>• Build a positive relationship</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rating Prompt */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Don't forget to rate your experience!
            </span>
          </div>
          <p className="text-xs text-blue-700">
            Your feedback helps other clients choose the right provider.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}