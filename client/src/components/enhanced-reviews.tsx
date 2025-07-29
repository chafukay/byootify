import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Star, ThumbsUp, ThumbsDown, MessageSquare, Camera, 
  Heart, Share2, Filter, SortDesc, MoreHorizontal, Flag, 
  Award, Verified, TrendingUp, Calendar, User
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface EnhancedReviewsProps {
  professionalId: number;
  showWriteReview?: boolean;
  maxReviews?: number;
}

export default function EnhancedReviews({ 
  professionalId, 
  showWriteReview = true,
  maxReviews 
}: EnhancedReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
    serviceId: "",
    photos: [] as File[]
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low' | 'helpful'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Fetch reviews with analytics
  const { data: reviewsData } = useQuery({
    queryKey: ["/api/providers", professionalId, "reviews", sortBy, filterRating],
    enabled: !!professionalId,
  });

  const { data: reviewStats } = useQuery({
    queryKey: ["/api/providers", professionalId, "review-stats"],
    enabled: !!professionalId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/providers", professionalId, "services"],
    enabled: !!professionalId,
  });

  const reviews = reviewsData?.reviews || [];
  const canWriteReview = reviewsData?.canWriteReview || false;

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const formData = new FormData();
      formData.append('rating', reviewData.rating.toString());
      formData.append('comment', reviewData.comment);
      formData.append('serviceId', reviewData.serviceId);
      formData.append('professionalId', professionalId.toString());
      
      reviewData.photos.forEach((photo: File, index: number) => {
        formData.append(`photos_${index}`, photo);
      });

      await apiRequest("POST", "/api/reviews", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      setNewReview({ rating: 0, comment: "", serviceId: "", photos: [] });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", professionalId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", professionalId, "review-stats"] });
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Submit Review",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) => {
      await apiRequest("POST", `/api/reviews/${reviewId}/helpful`, { isHelpful });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers", professionalId, "reviews"] });
    },
  });

  const reportReviewMutation = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      await apiRequest("POST", `/api/reviews/${reviewId}/report`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Review Reported",
        description: "Thank you for helping maintain quality reviews.",
      });
    },
  });

  const handleStarClick = (rating: number) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + newReview.photos.length > 5) {
      toast({
        title: "Too Many Photos",
        description: "Maximum 5 photos allowed per review.",
        variant: "destructive",
      });
      return;
    }
    setNewReview(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const removePhoto = (index: number) => {
    setNewReview(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newReview.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }

    if (!newReview.comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please write a review comment.",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate(newReview);
  };

  const renderStars = (rating: number, interactive = false, size = "h-4 w-4") => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive ? () => handleStarClick(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;
    
    if (filterRating !== null) {
      filtered = reviews.filter((review: any) => review.rating === filterRating);
    }

    switch (sortBy) {
      case 'oldest':
        return filtered.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'rating-high':
        return filtered.sort((a: any, b: any) => b.rating - a.rating);
      case 'rating-low':
        return filtered.sort((a: any, b: any) => a.rating - b.rating);
      case 'helpful':
        return filtered.sort((a: any, b: any) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
      default: // newest
        return filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const displayReviews = maxReviews 
    ? getFilteredAndSortedReviews().slice(0, maxReviews)
    : getFilteredAndSortedReviews();

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {reviewStats && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {reviewStats.averageRating?.toFixed(1) || "0.0"}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(reviewStats.averageRating || 0))}
                </div>
                <p className="text-sm text-gray-600">
                  Based on {reviewStats.totalReviews} reviews
                </p>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center space-x-2">
                    <span className="text-sm w-8">{stars}★</span>
                    <Progress 
                      value={(reviewStats.ratingDistribution?.[stars] || 0) / reviewStats.totalReviews * 100}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm text-gray-600 w-8">
                      {reviewStats.ratingDistribution?.[stars] || 0}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    {reviewStats.recentTrend || "0"}% improvement this month
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">
                    Top {reviewStats.percentile || 0}% in category
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Verified className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    {reviewStats.verifiedReviews || 0} verified bookings
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select 
              value={filterRating?.toString() || ""} 
              onValueChange={(value) => setFilterRating(value ? parseInt(value) : null)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Ratings</SelectItem>
                {[5, 4, 3, 2, 1].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>{rating} Stars</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <SortDesc className="h-4 w-4 text-gray-500" />
            <Select 
              value={sortBy} 
              onValueChange={(value) => setSortBy(value as any)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rating-high">Highest Rating</SelectItem>
                <SelectItem value="rating-low">Lowest Rating</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showWriteReview && canWriteReview && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Star className="h-4 w-4 mr-2" />
                Write Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex items-center space-x-2">
                    {renderStars(newReview.rating, true, "h-8 w-8")}
                    <span className="text-sm text-gray-600 ml-2">
                      {newReview.rating > 0 ? `${newReview.rating} star${newReview.rating !== 1 ? 's' : ''}` : 'Select rating'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Service</label>
                  <Select 
                    value={newReview.serviceId} 
                    onValueChange={(value) => setNewReview(prev => ({ ...prev, serviceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service: any) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - ${service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Review</label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Photos (Optional)</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="review-photos"
                    />
                    <label htmlFor="review-photos">
                      <Button type="button" variant="outline" asChild>
                        <span className="cursor-pointer">
                          <Camera className="h-4 w-4 mr-2" />
                          Add Photos
                        </span>
                      </Button>
                    </label>

                    {newReview.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {newReview.photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Review photo ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button 
                    type="submit" 
                    disabled={submitReviewMutation.isPending}
                  >
                    {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <AnimatePresence>
          {displayReviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600">
                  {filterRating ? `No ${filterRating}-star reviews found.` : "Be the first to leave a review!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            displayReviews.map((review: any) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.clientAvatar} />
                        <AvatarFallback>
                          {review.clientName?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {review.clientName || "Anonymous"}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{formatDistanceToNow(new Date(review.createdAt))} ago</span>
                              {review.isVerified && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center space-x-1">
                                    <Verified className="h-3 w-3 text-blue-600" />
                                    <span>Verified booking</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {renderStars(review.rating)}
                            <Badge variant="outline" className="text-xs">
                              {review.serviceName}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{review.comment}</p>

                        {review.photos && review.photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {review.photos.slice(0, 3).map((photo: any, index: number) => (
                              <img
                                key={index}
                                src={photo.url}
                                alt={`Review photo ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80"
                                onClick={() => {
                                  setSelectedPhotos(review.photos.map((p: any) => p.url));
                                  setShowPhotoDialog(true);
                                }}
                              />
                            ))}
                            {review.photos.length > 3 && (
                              <div className="w-full h-20 bg-gray-100 rounded-md flex items-center justify-center text-sm text-gray-600 cursor-pointer">
                                +{review.photos.length - 3} more
                              </div>
                            )}
                          </div>
                        )}

                        {review.response && (
                          <div className="bg-gray-50 rounded-lg p-4 mt-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">Provider Response</span>
                            </div>
                            <p className="text-sm text-gray-700">{review.response}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => helpfulMutation.mutate({ 
                                reviewId: review.id, 
                                isHelpful: true 
                              })}
                              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span>Helpful ({review.helpfulCount || 0})</span>
                            </button>
                            
                            <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => reportReviewMutation.mutate({ 
                                reviewId: review.id, 
                                reason: 'inappropriate' 
                              })}
                              className="text-sm text-gray-400 hover:text-red-600"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review Photos</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {selectedPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}