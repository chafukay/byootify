import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { ShoppingCart, Product } from "@shared/schema";

interface CartItem extends ShoppingCart {
  product: Product;
}

export default function Cart() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
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

  // Update Cart Quantity Mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      if (quantity === 0) {
        await apiRequest("DELETE", `/api/shop/cart/${productId}`);
      } else {
        await apiRequest("PUT", `/api/shop/cart/${productId}`, { quantity });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ title: "Cart updated successfully!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to manage your cart.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
        return;
      }
      toast({ title: "Failed to update cart", variant: "destructive" });
    },
  });

  // Remove from Cart Mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/shop/cart/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ title: "Item removed from cart" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to manage your cart.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
        return;
      }
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  // Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { items: any[]; shippingAddress: any }) => {
      const response = await apiRequest("POST", "/api/shop/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ 
        title: "Order placed successfully!", 
        description: `Order ${order.orderNumber} has been created.`
      });
      setShowCheckout(false);
      // Redirect to orders page or show success
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to place an order.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
        return;
      }
      toast({ title: "Failed to place order", variant: "destructive" });
    },
  });

  const cartTotal = cartItems.reduce((total: number, item: CartItem) => {
    return total + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  const shipping = cartTotal > 50 ? 0 : 9.99;
  const tax = cartTotal * 0.08; // 8% tax
  const finalTotal = cartTotal + shipping + tax;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to proceed with checkout.",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = "/api/login", 1500);
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    setShowCheckout(true);
  };

  const handlePlaceOrder = () => {
    const orderItems = cartItems.map((item: CartItem) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: parseFloat(item.product.price),
    }));

    createOrderMutation.mutate({
      items: orderItems,
      shippingAddress: shippingInfo,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your cart</h1>
          <p className="text-gray-600 mb-8">Please sign in to access your shopping cart and saved items.</p>
          <Button onClick={() => window.location.href = "/api/login"} className="bg-[#F25D22] hover:bg-[#E04A1A]">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        {cartLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#F25D22] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading cart...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Discover amazing beauty products in our shop!</p>
            <Button onClick={() => window.location.href = "/shop"} className="bg-[#F25D22] hover:bg-[#E04A1A]">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item: CartItem, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.product.imageUrl || "/api/placeholder/100/100"}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">{item.product.brand || "Byootify"}</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="text-xs mr-2">
                              {item.product.category}
                            </Badge>
                            {item.product.isRecommendedByProviders && (
                              <Badge className="bg-[#F25D22] text-white text-xs">
                                Provider Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartMutation.mutate({ 
                              productId: item.productId, 
                              quantity: item.quantity - 1 
                            })}
                            disabled={updateCartMutation.isPending || item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartMutation.mutate({ 
                              productId: item.productId, 
                              quantity: item.quantity + 1 
                            })}
                            disabled={updateCartMutation.isPending}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${item.product.price}</p>
                          <p className="text-sm text-gray-600">
                            Total: ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCartMutation.mutate(item.productId)}
                          disabled={removeFromCartMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-sm text-green-600">🎉 Free shipping on orders over $50!</p>
                  )}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    onClick={() => window.location.href = "/shop-checkout"}
                    className="w-full bg-[#F25D22] hover:bg-[#E04A1A]"
                    disabled={cartItems.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = "/shop"}
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Information
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              
              {/* Order Summary in Modal */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Order Summary</h3>
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
                  Back to Cart
                </Button>
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending}
                  className="flex-1 bg-[#F25D22] hover:bg-[#E04A1A]"
                >
                  {createOrderMutation.isPending ? "Processing..." : "Place Order"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}