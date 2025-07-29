import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, ShoppingBag, CreditCard, Truck, Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { ShoppingCart, Product } from "@shared/schema";

interface CartItem extends ShoppingCart {
  product: Product;
}

import { stripePromise, stripeError, isStripeAvailable } from "@/lib/stripe";

const CheckoutForm = ({ 
  cartItems, 
  shippingInfo, 
  subtotal, 
  shipping, 
  tax, 
  total 
}: {
  cartItems: CartItem[];
  shippingInfo: any;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { items: any[]; shippingAddress: any; paymentIntentId: string }) => {
      const response = await apiRequest("POST", "/api/shop/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ 
        title: "Order placed successfully!", 
        description: `Order ${order.orderNumber} has been created and payment processed.`
      });
      // Redirect to success page or order confirmation
      window.location.href = "/orders";
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to complete your order.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
        return;
      }
      toast({ 
        title: "Order failed", 
        description: "There was an issue processing your order. Please try again.",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Create the order with payment confirmation
      const orderItems = cartItems.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(item.product.price),
      }));

      createOrderMutation.mutate({
        items: orderItems,
        shippingAddress: shippingInfo,
        paymentIntentId: paymentIntent.id,
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </h3>
        <PaymentElement />
      </div>
      
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
        <Button 
          type="submit"
          disabled={!stripe || isProcessing || createOrderMutation.isPending}
          className="flex-1 bg-[#F25D22] hover:bg-[#E04A1A]"
        >
          {isProcessing || createOrderMutation.isPending ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Pay ${total.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function ShopCheckout() {
  const { user, isAuthenticated } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.firstName + " " + user?.lastName || "",
    email: user?.email || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  // Cart Query
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/shop/cart"],
    enabled: isAuthenticated,
  });

  const subtotal = cartItems.reduce((total: number, item: CartItem) => {
    return total + (parseFloat(item.product.price) * (item.quantity || 1));
  }, 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Create Payment Intent
  useEffect(() => {
    if (cartItems.length > 0 && isAuthenticated) {
      const orderItems = cartItems.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(item.product.price),
      }));

      apiRequest("POST", "/api/shop/create-payment-intent", {
        items: orderItems,
        shippingAddress: shippingInfo,
      })
        .then(res => res.json())
        .then(data => {
          setClientSecret(data.clientSecret);
        })
        .catch(error => {
          console.error("Error creating payment intent:", error);
        });
    }
  }, [cartItems, shippingInfo, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to checkout</h1>
          <p className="text-gray-600 mb-8">Please sign in to complete your purchase.</p>
          <Button onClick={() => window.location.href = "/api/login"} className="bg-[#F25D22] hover:bg-[#E04A1A]">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#F25D22] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
          <Button onClick={() => window.location.href = "/shop"} className="bg-[#F25D22] hover:bg-[#E04A1A]">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#F25D22] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
          <p className="text-gray-600">Complete your order with our secure payment system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={shippingInfo.name}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardContent className="pt-6">
                {stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm
                      cartItems={cartItems}
                      shippingInfo={shippingInfo}
                      subtotal={subtotal}
                      shipping={shipping}
                      tax={tax}
                      total={total}
                    />
                  </Elements>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item: CartItem, index: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={item.product.imageUrl || "/api/placeholder/60/60"}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-600">{item.product.brand}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs">Qty: {item.quantity || 1}</span>
                          {item.product.isRecommendedByProviders && (
                            <Badge className="bg-[#F25D22] text-white text-xs">
                              Provider Pick
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.product.price}</p>
                        <p className="text-xs text-gray-600">
                          Total: ${(parseFloat(item.product.price) * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-xs text-green-600">🎉 Free shipping on orders over $50!</p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Secure Payment</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}