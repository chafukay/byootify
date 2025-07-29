import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, Calendar, Clock, MapPin, User, 
  Shield, CheckCircle, AlertTriangle, ArrowLeft 
} from "lucide-react";

import { stripePromise, stripeError, isStripeAvailable } from "@/lib/stripe";

const CheckoutForm = ({ booking, onSuccess }: { booking: any; onSuccess: () => void }) => {
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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-confirmation?booking_id=${booking.id}`,
      },
      redirect: "if_required",
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your appointment has been confirmed!",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>

      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <Shield className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <Button 
        type="submit" 
        className="w-full gradient-primary text-lg py-3"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Complete Payment - ${(parseFloat(booking?.totalPrice || "0") * 1.35).toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const { bookingId } = useParams();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your payment.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ["/api/bookings", bookingId],
    enabled: !!bookingId,
  });

  // Create payment intent when booking is loaded
  useEffect(() => {
    if (booking && !clientSecret) {
      apiRequest("POST", "/api/create-payment-intent", { 
        amount: parseFloat(booking?.totalPrice || "0") * 1.35 // Include service fee and hold fee
      })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          toast({
            title: "Payment Setup Failed",
            description: "Unable to setup payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [booking, clientSecret, toast]);

  const handlePaymentSuccess = () => {
    setLocation(`/booking-confirmation?booking_id=${bookingId}`);
  };

  if (authLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
              <p className="text-gray-600 mb-6">The booking you're trying to pay for doesn't exist or has already been processed.</p>
              <Button onClick={() => setLocation("/")}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up payment...</p>
          </div>
        </div>
      </div>
    );
  }

  const appointmentDate = new Date(booking?.appointmentDate || new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/booking/${booking?.professionalId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Secure checkout for your beauty appointment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            {stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm booking={booking} onSuccess={handlePaymentSuccess} />
              </Elements>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment System Unavailable</h3>
                    <p className="text-gray-600 mb-4">
                      Unable to load payment system. Please try refreshing the page or contact support.
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      Refresh Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Professional Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking?.professionalName || "Beauty Professional"}
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {booking?.professionalLocation || "Location"}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Appointment Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Appointment Details</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Date</span>
                      </div>
                      <span className="font-medium">
                        {appointmentDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Time</span>
                      </div>
                      <span className="font-medium">
                        {appointmentDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Services */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Services</h4>
                  <div className="space-y-2">
                    {booking?.services?.map((service: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{service.name}</span>
                        <span className="font-medium">${service.price}</span>
                      </div>
                    )) || (
                      <div className="flex justify-between items-center text-sm">
                        <span>Beauty Services</span>
                        <span className="font-medium">${booking?.totalPrice}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                {booking?.notes && (
                  <>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                      <p className="text-sm text-gray-600 italic">"{booking?.notes}"</p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Pricing Breakdown - Phase 1 MVP */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Payment Breakdown</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Cost</span>
                      <span className="font-medium">${parseFloat(booking?.totalPrice || "0").toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Fee (10%)</span>
                      <span className="font-medium">${(parseFloat(booking?.totalPrice || "0") * 0.10).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Hold Fee (25%)</span>
                      <span className="font-medium">${(parseFloat(booking?.totalPrice || "0") * 0.25).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-blue-600">
                      <span>Provider receives (after 15% commission)</span>
                      <span>${(parseFloat(booking?.totalPrice || "0") * 0.85).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Due</span>
                    <span>${(parseFloat(booking?.totalPrice || "0") * 1.35).toFixed(2)}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Hold fee refunded after service completion</p>
                    <p>• 15% commission supports platform operations</p>
                    <p>• Provider gets next-day payout</p>
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Payment Pending
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Complete payment to confirm your appointment
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Secure Payment</h3>
            <p className="text-sm text-gray-600">Your payment information is encrypted and secure</p>
          </Card>

          <Card className="text-center p-6">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Instant Confirmation</h3>
            <p className="text-sm text-gray-600">Get immediate booking confirmation via email</p>
          </Card>

          <Card className="text-center p-6">
            <User className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Verified Professionals</h3>
            <p className="text-sm text-gray-600">All professionals are background verified</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
