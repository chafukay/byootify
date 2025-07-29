import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import MobileShop from "@/components/mobile-shop";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMobile } from "@/hooks/use-mobile";
import { Star, Heart, ShoppingCart, Search, Plus, Minus, Package, Truck, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Shop() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <MobileShop />
      </div>
    );
  }

  // Desktop Layout continues...

  // Products Query
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/shop/products", searchTerm, selectedCategory, priceRange, sortBy],
  });

  // Cart Query
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<any[]>({
    queryKey: ["/api/shop/cart"],
    enabled: isAuthenticated,
  });

  // Wishlist Query
  const { data: wishlistItems = [], isLoading: wishlistLoading } = useQuery<any[]>({
    queryKey: ["/api/shop/wishlist"],
    enabled: isAuthenticated,
  });

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: number; quantity?: number }) => {
      await apiRequest("POST", "/api/shop/cart", { productId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/cart"] });
      toast({ title: "Added to cart successfully!" });
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

  // Add to Wishlist Mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("POST", "/api/shop/wishlist", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/wishlist"] });
      toast({ title: "Added to wishlist!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save items to your wishlist.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
        return;
      }
      toast({ title: "Failed to add to wishlist", variant: "destructive" });
    },
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

  // Add Product Review Mutation
  const addReviewMutation = useMutation({
    mutationFn: async ({ productId, rating, comment }: { productId: number; rating: number; comment: string }) => {
      await apiRequest("POST", "/api/shop/reviews", { productId, rating, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
      toast({ title: "Review added successfully!" });
      setSelectedProduct(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to leave a review.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 1500);
        return;
      }
      toast({ title: "Failed to add review", variant: "destructive" });
    },
  });

  const categories = [
    { value: "all", label: "All Products" },
    { value: "skincare", label: "Skincare" },
    { value: "haircare", label: "Hair Care" },
    { value: "makeup", label: "Makeup" },
    { value: "tools", label: "Tools & Accessories" },
    { value: "professional", label: "Professional Grade" }
  ];

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    
    let matchesPrice = true;
    if (priceRange !== "all") {
      const price = parseFloat(product.price);
      switch (priceRange) {
        case "under-25":
          matchesPrice = price < 25;
          break;
        case "25-50":
          matchesPrice = price >= 25 && price <= 50;
          break;
        case "50-100":
          matchesPrice = price > 50 && price <= 100;
          break;
        case "over-100":
          matchesPrice = price > 100;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const isInWishlist = wishlistItems.some((item: any) => item.productId === product.id);
    const cartItem = cartItems.find((item: any) => item.productId === product.id);

    return (
      <div key={product.id}>
        <Card className="group hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="relative">
              <img
                src={product.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop"}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop";
                }}
              />
              {product.isRecommendedByProviders && (
                <Badge className="absolute top-2 left-2 bg-[#F25D22] text-white">
                  <Award className="h-3 w-3 mr-1" />
                  Provider Recommended
                </Badge>
              )}
              {!product.inStock && (
                <Badge className="absolute top-2 right-2 bg-gray-500 text-white">
                  Out of Stock
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white ${
                  isInWishlist ? "text-red-500" : ""
                }`}
                onClick={() => !isInWishlist && addToWishlistMutation.mutate(product.id)}
                disabled={addToWishlistMutation.isPending}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
              </Button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {product.brand || "Byootify"}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 flex-shrink-0">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                {product.description}
              </p>
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(parseFloat(product.rating || "0"))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {product.rating || "0"} ({product.reviewCount || 0})
                </span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-bold text-gray-900">
                  ${product.price}
                </span>
                {product.inStock ? (
                  cartItem ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCartMutation.mutate({ 
                          productId: product.id, 
                          quantity: cartItem.quantity - 1 
                        })}
                        disabled={updateCartMutation.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">{cartItem.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCartMutation.mutate({ 
                          productId: product.id, 
                          quantity: cartItem.quantity + 1 
                        })}
                        disabled={updateCartMutation.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      className="bg-[#F25D22] hover:bg-[#E04A1A]"
                      onClick={() => addToCartMutation.mutate({ productId: product.id })}
                      disabled={addToCartMutation.isPending}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  )
                ) : (
                  <Button size="sm" disabled>
                    Out of Stock
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setSelectedProduct(product)}
              >
                View Details & Reviews
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const cartTotal = cartItems.reduce((total: number, item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    return total + (product ? parseFloat(product.price) * item.quantity : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-11">
        {/* Cart Badge (if items exist) */}
        {isAuthenticated && cartItems.length > 0 && (
          <div className="text-center mb-6">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cartItems.length} items - ${cartTotal.toFixed(2)}
            </Badge>
          </div>
        )}

        {/* Hero Section - eBay Style with Carousel */}
        <HeroBannerCarousel 
          currentIndex={currentBannerIndex}
          isPaused={isPaused}
          onIndexChange={setCurrentBannerIndex}
          onPauseChange={setIsPaused}
          onCategoryFilter={setSelectedCategory}
          onPriceFilter={setPriceRange}
        />

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Search & Filter</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under-25">Under $25</SelectItem>
                    <SelectItem value="25-50">$25 - $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="over-100">Over $100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Most Popular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600 pt-4 border-t">
                Showing {filteredProducts.length} products
              </div>
            </div>

            {/* Advertisement Banner */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white relative rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="text-xs font-semibold mb-2 opacity-80">SPECIAL OFFER</div>
                <h3 className="text-lg font-bold mb-2">Get 25% Off</h3>
                <p className="text-sm mb-4 opacity-90">Professional skincare sets from top brands</p>
                <Button 
                  size="sm" 
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                  onClick={() => setSelectedCategory("skincare")}
                >
                  Shop Now
                </Button>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/20 rounded-full"></div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-white/10 rounded-full"></div>
            </div>

            {/* Second Ad Banner */}
            <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white relative rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="text-xs font-semibold mb-1 opacity-80">NEW ARRIVALS</div>
                <h4 className="text-sm font-bold mb-2">Winter Collection</h4>
                <p className="text-xs mb-3 opacity-90">Hydrating serums & nourishing creams</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs border-white text-white hover:bg-white/10 h-7"
                  onClick={() => setPriceRange("all")}
                >
                  Explore
                </Button>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white/20 rounded-full"></div>
            </div>
          </div>

          {/* Right Content - Products */}
          <div className="flex-1">
            {/* Products Grid */}
            {productsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[#F25D22] border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: Product, index: number) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}

            {filteredProducts.length === 0 && !productsLoading && (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Shopping Features Section at Bottom */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Shop With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-[#F25D22] mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-lg">Free Shipping</h3>
              <p className="text-gray-600">Enjoy free shipping on all orders over $50. No hidden fees, just premium beauty products delivered to your door.</p>
            </div>
            <div className="text-center">
              <Truck className="h-12 w-12 text-[#F25D22] mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-lg">Fast Delivery</h3>
              <p className="text-gray-600">Get your beauty essentials quickly with our 2-3 business day delivery. Because your beauty routine can't wait.</p>
            </div>
            <div className="text-center">
              <Award className="h-12 w-12 text-[#F25D22] mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-lg">Provider Approved</h3>
              <p className="text-gray-600">Every product is handpicked and recommended by our network of professional beauty providers.</p>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 && !productsLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found matching your criteria.</p>
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <img
                  src={selectedProduct.imageUrl || "/api/placeholder/400/400"}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div>
                  <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
                  <div className="space-y-2 mb-4">
                    <p><strong>Brand:</strong> {selectedProduct.brand || "Byootify"}</p>
                    <p><strong>Category:</strong> {selectedProduct.category}</p>
                    <p><strong>Price:</strong> ${selectedProduct.price}</p>
                    <p><strong>In Stock:</strong> {selectedProduct.inStock ? "Yes" : "No"}</p>
                  </div>
                  {selectedProduct.tags && (
                    <div className="mb-4">
                      <p className="font-medium mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProduct.ingredients && (
                    <div className="mb-4">
                      <p className="font-medium mb-2">Key Ingredients:</p>
                      <p className="text-sm text-gray-600">{selectedProduct.ingredients.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add Review Section */}
              {isAuthenticated && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-3">Add a Review</h3>
                  <ReviewForm 
                    onSubmit={(rating, comment) => 
                      addReviewMutation.mutate({ 
                        productId: selectedProduct.id, 
                        rating, 
                        comment 
                      })
                    }
                    isLoading={addReviewMutation.isPending}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

// Hero Banner Carousel Component
function HeroBannerCarousel({ 
  currentIndex, 
  isPaused, 
  onIndexChange, 
  onPauseChange, 
  onCategoryFilter, 
  onPriceFilter 
}: {
  currentIndex: number;
  isPaused: boolean;
  onIndexChange: (index: number) => void;
  onPauseChange: (paused: boolean) => void;
  onCategoryFilter: (category: string) => void;
  onPriceFilter: (range: string) => void;
}) {
  const banners = [
    {
      id: 1,
      title: "Beauty Arsenal",
      subtitle: "Collect premium beauty products backed by Authenticity Guarantee.",
      badge: "AUTHENTICITY GUARANTEE",
      gradientFrom: "#1e3a8a",
      gradientTo: "#3b82f6",
      primaryAction: "Trending Items",
      secondaryAction: "Latest Arrivals",
      primaryCategory: "skincare",
      secondaryCategory: "makeup",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop"
    },
    {
      id: 2,
      title: "Winter Skincare",
      subtitle: "Combat dry winter skin with hydrating serums and nourishing treatments.",
      badge: "SEASONAL SPECIAL",
      gradientFrom: "#7c2d12",
      gradientTo: "#ea580c",
      primaryAction: "Trending Items",
      secondaryAction: "Latest Arrivals",
      primaryCategory: "skincare",
      secondaryCategory: "haircare",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop"
    },
    {
      id: 3,
      title: "Pro Makeup Collection",
      subtitle: "Artist-quality cosmetics for flawless looks every time.",
      badge: "PRO COLLECTION",
      gradientFrom: "#581c87",
      gradientTo: "#a855f7",
      primaryAction: "Trending Items",
      secondaryAction: "Latest Arrivals",
      primaryCategory: "makeup",
      secondaryCategory: "skincare",
      image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop"
    },
    {
      id: 4,
      title: "Hair Care Transformation",
      subtitle: "Transform your hair with professional-grade treatments and styling products.",
      badge: "NEW ARRIVALS",
      gradientFrom: "#134e4a",
      gradientTo: "#059669",
      primaryAction: "Trending Items",
      secondaryAction: "Latest Arrivals",
      primaryCategory: "haircare",
      secondaryCategory: "skincare",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop"
    }
  ];

  const currentBanner = banners[currentIndex];

  // Auto-scroll functionality
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        onIndexChange((currentIndex + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, isPaused, onIndexChange, banners.length]);

  const nextBanner = () => {
    onIndexChange((currentIndex + 1) % banners.length);
  };

  const prevBanner = () => {
    onIndexChange(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const togglePause = () => {
    onPauseChange(!isPaused);
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl">
      <div 
        className="h-[300px] flex items-center relative transition-all duration-500"
        style={{
          background: `linear-gradient(to right, ${currentBanner.gradientFrom}, ${currentBanner.gradientTo})`
        }}
        onMouseEnter={() => onPauseChange(true)}
        onMouseLeave={() => onPauseChange(false)}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 transform rotate-45 bg-white/20 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 transform -rotate-45 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-white rounded-full mr-3 flex items-center justify-center relative">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${currentBanner.gradientFrom}, ${currentBanner.gradientTo})`
                    }}
                  ></div>
                </div>
                <span className="text-lg font-semibold">{currentBanner.badge}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {currentBanner.title}
              </h2>
              <p className="text-xl mb-6 text-blue-100">
                {currentBanner.subtitle}
              </p>
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="bg-white hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg"
                  style={{ color: currentBanner.gradientFrom }}
                  onClick={() => onCategoryFilter(currentBanner.primaryCategory)}
                >
                  {currentBanner.primaryAction}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white px-8 py-3 rounded-lg transition-all bg-transparent"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'white'
                  }}
                  onClick={() => onCategoryFilter(currentBanner.secondaryCategory)}
                >
                  {currentBanner.secondaryAction}
                </Button>
              </div>
            </div>

            {/* Right Product Showcase */}
            <div className="relative">
              <div className="flex justify-center items-center">
                <div className="relative">
                  <img
                    src={currentBanner.image}
                    alt="Beauty Products"
                    className="w-80 h-60 object-cover rounded-lg shadow-2xl transform rotate-12 transition-all duration-500"
                  />
                  {/* Floating Products */}
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center transform -rotate-12">
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&h=100&fit=crop"
                      alt="Product"
                      className="w-12 h-12 object-cover rounded"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center transform rotate-12">
                    <img
                      src="https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100&h=100&fit=crop"
                      alt="Product"
                      className="w-12 h-12 object-cover rounded"
                    />
                  </div>
                  <div className="absolute top-1/2 -right-8 w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&h=100&fit=crop"
                      alt="Product"
                      className="w-8 h-8 object-cover rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>


      </div>
    </div>
  );
}

// Review Form Component
function ReviewForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (rating: number, comment: string) => void;
  isLoading: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, comment);
    setComment("");
    setRating(5);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="p-1"
            >
              <Star
                className={`h-5 w-5 ${
                  value <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Comment</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={3}
          required
        />
      </div>
      <Button type="submit" disabled={isLoading} className="bg-[#F25D22] hover:bg-[#E04A1A]">
        {isLoading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}