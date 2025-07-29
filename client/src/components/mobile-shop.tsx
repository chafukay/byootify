import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Star, Heart, ShoppingCart, Search, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
  imageUrl: string;
  isRecommended?: boolean;
}

export default function MobileShop() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/shop/products", searchTerm, selectedCategory],
  });

  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/shop/cart"],
    enabled: isAuthenticated,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: number; quantity?: number }) => {
      await apiRequest("POST", "/api/shop/cart", { productId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ title: "Added to cart!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to your cart.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
        return;
      }
      toast({ title: "Failed to add to cart", variant: "destructive" });
    },
  });

  const categories = [
    { id: "all", name: "All Products" },
    { id: "hair-care", name: "Hair Care" },
    { id: "skincare", name: "Skincare" },
    { id: "makeup", name: "Makeup" },
    { id: "tools", name: "Tools" },
    { id: "nail-care", name: "Nail Care" },
  ];

  const getCartQuantity = (productId: number) => {
    const item = cartItems.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

  return (
    <div className="pt-20 pb-20 px-4 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#F25D22] to-[#E04A1A] rounded-2xl p-6 text-white text-center">
        <h1 className="text-2xl font-bold mb-2">Beauty Products</h1>
        <p className="text-sm opacity-90">Professional products used by top providers</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 py-3 text-base rounded-xl"
        />
      </div>

      {/* Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 overflow-hidden">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={product.imageUrl || "/placeholder-product.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.isRecommended && (
                      <Badge className="absolute top-2 left-2 bg-[#F25D22] text-white text-xs">
                        Recommended
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviewCount})</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F25D22]">${product.price}</span>
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>

                    {/* Add to Cart */}
                    <div className="pt-2">
                      {getCartQuantity(product.id) > 0 ? (
                        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            onClick={() => addToCartMutation.mutate({ productId: product.id, quantity: -1 })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium text-sm">{getCartQuantity(product.id)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            onClick={() => addToCartMutation.mutate({ productId: product.id, quantity: 1 })}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full bg-[#F25D22] hover:bg-[#E04A1A] text-white text-xs py-2"
                          onClick={() => addToCartMutation.mutate({ productId: product.id })}
                          disabled={addToCartMutation.isPending}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}