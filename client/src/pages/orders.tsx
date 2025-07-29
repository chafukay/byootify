import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Package, Calendar, MapPin, CreditCard, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { ProductOrder } from "@shared/schema";

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Orders Query
  const { data: orders = [], isLoading } = useQuery<ProductOrder[]>({
    queryKey: ["/api/shop/orders"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view your orders.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
      }
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view orders</h1>
          <p className="text-gray-600 mb-8">Please sign in to see your order history.</p>
          <Button onClick={() => window.location.href = "/api/login"} className="bg-[#F25D22] hover:bg-[#E04A1A]">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#F25D22] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/shop"}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
            <p className="text-gray-600">Track and manage your beauty product orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-8">Start shopping to see your orders here!</p>
            <Button onClick={() => window.location.href = "/shop"} className="bg-[#F25D22] hover:bg-[#E04A1A]">
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.createdAt || "").toLocaleDateString()}
                          </div>
                          {order.paidAmount && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              ${order.paidAmount}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status || "pending")}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Shipping Address
                        </h4>
                        {order.shippingAddress && typeof order.shippingAddress === 'object' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{(order.shippingAddress as any).name}</p>
                            <p>{(order.shippingAddress as any).address}</p>
                            <p>
                              {(order.shippingAddress as any).city}, {(order.shippingAddress as any).state} {(order.shippingAddress as any).zipCode}
                            </p>
                            {(order.shippingAddress as any).phone && (
                              <p>Phone: {(order.shippingAddress as any).phone}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Order Summary</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Total Amount</span>
                            <span className="font-medium">${order.totalAmount}</span>
                          </div>
                          {order.paidAmount && (
                            <div className="flex justify-between text-green-600">
                              <span>Amount Paid</span>
                              <span className="font-medium">${order.paidAmount}</span>
                            </div>
                          )}
                          {order.trackingNumber && (
                            <div className="flex justify-between">
                              <span>Tracking</span>
                              <span className="font-mono text-xs">{order.trackingNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {order.status === "paid" && (
                      <div className="mt-6 p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Payment Confirmed</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Your payment has been processed successfully. We're preparing your order for shipment.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}