import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sparkles, Star, MapPin, Clock, TrendingUp, Heart,
  Zap, Target, ThumbsUp, Users
} from "lucide-react";
import { motion } from "framer-motion";

interface RecommendationScore {
  overall: number;
  style_match: number;
  location_proximity: number;
  availability_fit: number;
  price_alignment: number;
  review_quality: number;
}

interface AIRecommendation {
  provider: {
    id: number;
    businessName: string;
    profilePicture: string;
    specialties: string[];
    rating: string;
    reviewCount: number;
    location: string;
    priceRange: string;
    distance: number;
  };
  recommendation_score: RecommendationScore;
  reasons: string[];
  match_percentage: number;
  predicted_satisfaction: number;
  style_compatibility: {
    user_preferences: string[];
    provider_strengths: string[];
    match_keywords: string[];
  };
}

interface AIRecommendationsProps {
  userPreferences?: {
    style_preferences?: string[];
    budget_range?: [number, number];
    location?: string;
    preferred_time?: string;
    service_type?: string;
  };
  limit?: number;
}

export default function AIRecommendations({ userPreferences, limit = 6 }: AIRecommendationsProps) {
  const { user, isAuthenticated } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  // Fetch AI-powered recommendations
  const { data: recommendations = [], isLoading } = useQuery<AIRecommendation[]>({
    queryKey: ["/api/ai/recommendations", userPreferences],
    queryFn: async () => {
      // Simulate AI recommendation service
      const mockRecommendations: AIRecommendation[] = [
        {
          provider: {
            id: 14,
            businessName: "Gold and Ash Hair Salon",
            profilePicture: "https://images.fresha.com/locations/location-profile-images/649542/4479510/4ff8b3a9-e246-40ec-b458-a78cde506caf-GoldandAshHairSalon-US-Illinois-Palatine-Fresha.jpg?class=width-small",
            specialties: ["Hair Styling", "Hair Coloring"],
            rating: "5.0",
            reviewCount: 1419,
            location: "Palatine, IL",
            priceRange: "$60-250",
            distance: 2.3
          },
          recommendation_score: {
            overall: 94,
            style_match: 96,
            location_proximity: 90,
            availability_fit: 85,
            price_alignment: 88,
            review_quality: 98
          },
          reasons: [
            "Exceptional color expertise matches your highlighted preferences",
            "Consistently high ratings in your preferred service category",
            "Located within your ideal travel distance",
            "Price range aligns with your specified budget"
          ],
          match_percentage: 94,
          predicted_satisfaction: 96,
          style_compatibility: {
            user_preferences: ["modern cuts", "color highlights", "trendy styles"],
            provider_strengths: ["precision cutting", "creative coloring", "trend expertise"],
            match_keywords: ["modern", "creative", "trendy", "precision"]
          }
        },
        {
          provider: {
            id: 13,
            businessName: "Just in Style",
            profilePicture: "https://images.fresha.com/locations/location-profile-images/138255/2817370/8072e840-53fb-4716-a0f2-2a2492c27ba6-JustinStyle-US-Missouri-StLouis-Fresha.jpg?class=width-small",
            specialties: ["Hair Styling", "Beauty Services"],
            rating: "5.0",
            reviewCount: 2018,
            location: "St. Louis, MO",
            priceRange: "$45-180",
            distance: 5.7
          },
          recommendation_score: {
            overall: 89,
            style_match: 91,
            location_proximity: 78,
            availability_fit: 92,
            price_alignment: 95,
            review_quality: 94
          },
          reasons: [
            "Excellent value for comprehensive beauty services",
            "High availability matches your flexible schedule",
            "Strong reputation for personalized styling",
            "Broad service range covers multiple beauty needs"
          ],
          match_percentage: 89,
          predicted_satisfaction: 91,
          style_compatibility: {
            user_preferences: ["comprehensive beauty", "value-focused", "flexible scheduling"],
            provider_strengths: ["full service beauty", "affordable pricing", "flexible appointments"],
            match_keywords: ["comprehensive", "value", "flexible", "personalized"]
          }
        },
        {
          provider: {
            id: 9,
            businessName: "My Friends Nail Spa",
            profilePicture: "https://images.fresha.com/locations/location-profile-images/399900/1874093/fa95948a-d7b4-48e8-9246-9536f32eaf4e-MyFriendsNailSpa-US-Colorado-Denver-WashPark-Fresha.jpg?class=width-small",
            specialties: ["Nails", "Nail Art"],
            rating: "5.0",
            reviewCount: 2766,
            location: "Denver, CO",
            priceRange: "$30-80",
            distance: 1.2
          },
          recommendation_score: {
            overall: 87,
            style_match: 85,
            location_proximity: 98,
            availability_fit: 80,
            price_alignment: 92,
            review_quality: 88
          },
          reasons: [
            "Premier nail spa in trendy Wash Park neighborhood",
            "Exceptional creative nail design capabilities",
            "Very close to your location",
            "Affordable pricing with premium results"
          ],
          match_percentage: 87,
          predicted_satisfaction: 89,
          style_compatibility: {
            user_preferences: ["creative designs", "trendy location", "nail art"],
            provider_strengths: ["creative nail art", "trendy style", "neighborhood reputation"],
            match_keywords: ["creative", "trendy", "art", "design"]
          }
        }
      ];

      return mockRecommendations.slice(0, limit);
    },
    enabled: true
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold">AI Recommendations Loading...</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-bold text-gray-900">AI-Powered Recommendations</h3>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Personalized for You
        </Badge>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedProvider === rec.provider.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedProvider(
                selectedProvider === rec.provider.id ? null : rec.provider.id
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={rec.provider.profilePicture} />
                      <AvatarFallback>
                        {rec.provider.businessName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {rec.provider.businessName}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {rec.provider.rating} ({rec.provider.reviewCount})
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={getScoreBadgeVariant(rec.match_percentage)} 
                    className="text-xs"
                  >
                    {rec.match_percentage}% Match
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Quick Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <MapPin className="h-3 w-3" />
                    {rec.provider.location} • {rec.provider.distance}mi away
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    {rec.provider.priceRange}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rec.provider.specialties.slice(0, 2).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {rec.predicted_satisfaction}% Predicted Satisfaction
                    </span>
                  </div>
                  
                  {/* Top Reason */}
                  <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                    <div className="flex items-start gap-1">
                      <ThumbsUp className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{rec.reasons[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedProvider === rec.provider.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 border-t pt-3"
                  >
                    {/* Detailed Scores */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Compatibility Breakdown:</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Style Match:</span>
                          <span className={getScoreColor(rec.recommendation_score.style_match)}>
                            {rec.recommendation_score.style_match}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className={getScoreColor(rec.recommendation_score.location_proximity)}>
                            {rec.recommendation_score.location_proximity}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price Fit:</span>
                          <span className={getScoreColor(rec.recommendation_score.price_alignment)}>
                            {rec.recommendation_score.price_alignment}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reviews:</span>
                          <span className={getScoreColor(rec.recommendation_score.review_quality)}>
                            {rec.recommendation_score.review_quality}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Style Compatibility */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Style Compatibility:</h5>
                      <div className="flex flex-wrap gap-1">
                        {rec.style_compatibility.match_keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-xs bg-green-50 text-green-700">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* All Reasons */}
                    <div className="space-y-1">
                      <h5 className="text-sm font-medium">Why We Recommend:</h5>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {rec.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/provider/${rec.provider.id}`;
                      }}
                    >
                      View Profile & Book
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-1">
          <Sparkles className="h-4 w-4" />
          Recommendations powered by AI analysis of your preferences, location, and booking history
        </p>
      </div>
    </div>
  );
}