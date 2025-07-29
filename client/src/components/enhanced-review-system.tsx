import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Star, ThumbsUp, ThumbsDown, Camera, Reply, Flag, MoreHorizontal, Heart, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

interface EnhancedReviewSystemProps {
  providerId: number;
  bookingId?: string;
  showCreateReview?: boolean;
}

interface ReviewPhoto {
  id: string;
  url: string;
  caption?: string;
}

interface Review {
  id: string;
  clientName: string;
  clientAvatar?: string;
  rating: number;
  title: string;
  content: string;
  photos: ReviewPhoto[];
  helpfulCount: number;
  notHelpfulCount: number;
  hasUserVoted: boolean;
  userVoteType?: 'helpful' | 'not_helpful';
  providerResponse?: {
    content: string;
    respondedAt: string;
  };
  createdAt: string;
  verifiedBooking: boolean;
  serviceType: string;
}

export default function EnhancedReviewSystem({ 
  providerId, 
  bookingId, 
  showCreateReview = false 
}: EnhancedReviewSystemProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    content: "",
    photos: [] as File[],
  });
  const [showPhotoModal, setShowPhotoModal] = useState<ReviewPhoto | null>(null);
  const [responseText, setResponseText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reviews with enhanced data
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["/api/providers", providerId, "reviews", "enhanced"],
    refetchInterval: 30000, // Refresh for new responses and votes
  });

  const reviews = reviewsData?.reviews || [];
  const reviewStats = reviewsData?.stats || {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    responseRate: 0,
  };

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const formData = new FormData();
      formData.append('providerId', providerId.toString());
      formData.append('bookingId', bookingId || '');
      formData.append('rating', reviewData.rating.toString());
      formData.append('title', reviewData.title);
      formData.append('content', reviewData.content);
      
      // Add photos
      reviewData.photos.forEach((photo: File, index: number) => {
        formData.append(`photos`, photo);
      });

      const response = await apiRequest("POST", "/api/reviews/enhanced", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Posted",
        description: "Thank you for sharing your experience!",
      });
      
      setNewReview({ rating: 5, title: "", content: "", photos: [] });
      setSelectedPhotos([]);
      
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "reviews"]
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to leave a review",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Failed to Post Review",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Vote on review helpfulness
  const voteOnReviewMutation = useMutation({
    mutationFn: async ({ reviewId, voteType }: { reviewId: string; voteType: 'helpful' | 'not_helpful' }) => {
      const response = await apiRequest("POST", `/api/reviews/${reviewId}/vote`, {
        voteType
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "reviews"]
      });
    },
  });

  // Provider response mutation
  const respondToReviewMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const res = await apiRequest("POST", `/api/reviews/${reviewId}/respond`, {
        response
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Posted",
        description: "Your response has been added to the review",
      });
      
      setResponseText("");
      setActiveReplyId(null);
      
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "reviews"]
      });
    },
  });

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newPhotos = Array.from(files).slice(0, 5 - selectedPhotos.length);
    setSelectedPhotos(prev => [...prev, ...newPhotos]);
    setNewReview(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setNewReview(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitReview = () => {
    if (!newReview.title || !newReview.content) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and detailed review",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate(newReview);
  };

  const renderStarRating = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive ? () => onRatingChange?.(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews & Ratings</span>
            <Badge variant="secondary">
              {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {reviewStats.averageRating.toFixed(1)}
              </div>
              {renderStarRating(Math.round(reviewStats.averageRating))}
              <p className="text-sm text-gray-600 mt-2">
                Based on {reviewStats.totalReviews} reviews
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm w-3">{stars}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ 
                        width: `${((reviewStats.ratingDistribution[stars] || 0) / reviewStats.totalReviews) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {reviewStats.ratingDistribution[stars] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Response Rate */}
          {reviewStats.responseRate > 0 && (
            <div className="mt-6 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  This provider responds to {reviewStats.responseRate}% of reviews
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Review Form */}
      {showCreateReview && (
        <Card>
          <CardHeader>
            <CardTitle>Share Your Experience</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Rating Selection */}
            <div>
              <Label className="text-sm font-medium">Rating</Label>
              <div className="mt-1">
                {renderStarRating(newReview.rating, true, (rating) =>
                  setNewReview(prev => ({ ...prev, rating }))
                )}
              </div>
            </div>

            {/* Review Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input
                id="title"
                placeholder="Summarize your experience"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Review Content */}
            <div>
              <Label htmlFor="content" className="text-sm font-medium">Review</Label>
              <Textarea
                id="content"
                placeholder="Tell others about your experience with this provider..."
                rows={4}
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="text-sm font-medium">Add Photos (Optional)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                  disabled={selectedPhotos.length >= 5}
                />
                <label
                  htmlFor="photo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedPhotos.length >= 5 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-sm">
                    Add Photos ({selectedPhotos.length}/5)
                  </span>
                </label>
              </div>

              {/* Photo Previews */}
              {selectedPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmitReview}
              disabled={createReviewMutation.isPending}
              className="w-full bg-secondary hover:bg-secondary/90"
            >
              {createReviewMutation.isPending ? "Posting Review..." : "Post Review"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Be the first to share your experience!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review: Review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={review.clientAvatar} />
                        <AvatarFallback>
                          {review.clientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{review.clientName}</h4>
                          {review.verifiedBooking && (
                            <Badge variant="outline" className="text-xs">
                              Verified Booking
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {renderStarRating(review.rating)}
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <Badge variant="secondary" className="text-xs mt-1">
                          {review.serviceType}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">{review.title}</h5>
                    <p className="text-gray-700 leading-relaxed">{review.content}</p>
                  </div>

                  {/* Review Photos */}
                  {review.photos.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {review.photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setShowPhotoModal(photo)}
                          className="relative group"
                        >
                          <img
                            src={photo.url}
                            alt="Review photo"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-opacity flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Helpfulness Voting */}
                  <div className="flex items-center gap-4 mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteOnReviewMutation.mutate({
                        reviewId: review.id,
                        voteType: 'helpful'
                      })}
                      disabled={review.hasUserVoted}
                      className={review.userVoteType === 'helpful' ? 'bg-green-50 text-green-700' : ''}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpfulCount})
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteOnReviewMutation.mutate({
                        reviewId: review.id,
                        voteType: 'not_helpful'
                      })}
                      disabled={review.hasUserVoted}
                      className={review.userVoteType === 'not_helpful' ? 'bg-red-50 text-red-700' : ''}
                    >
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Not Helpful ({review.notHelpfulCount})
                    </Button>
                  </div>

                  {/* Provider Response */}
                  {review.providerResponse && (
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-start gap-2">
                        <Reply className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <h6 className="font-medium text-blue-900 mb-1">Provider Response</h6>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            {review.providerResponse.content}
                          </p>
                          <p className="text-blue-600 text-xs mt-2">
                            {formatDistanceToNow(new Date(review.providerResponse.respondedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Photo Modal */}
      <Dialog open={!!showPhotoModal} onOpenChange={() => setShowPhotoModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Photo</DialogTitle>
          </DialogHeader>
          {showPhotoModal && (
            <div>
              <img
                src={showPhotoModal.url}
                alt="Review photo"
                className="w-full h-auto rounded-lg"
              />
              {showPhotoModal.caption && (
                <p className="text-gray-600 mt-2">{showPhotoModal.caption}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}