import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/navigation";
import ReviewCard from "@/components/review-card";
import { Professional, Service, Review } from "@shared/schema";
import { 
  Star, MapPin, Phone, Globe, Instagram, Verified, 
  Calendar, Clock, DollarSign, Award, Users, Scissors 
} from "lucide-react";

export default function ProfessionalProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const professionalId = parseInt(id as string);

  const { data: professional, isLoading } = useQuery<Professional>({
    queryKey: ["/api/providers", professionalId],
    enabled: !!professionalId,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/providers", professionalId, "services"],
    enabled: !!professionalId,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/providers", professionalId, "reviews"],
    enabled: !!professionalId,
  });

  const { data: portfolio = [] } = useQuery<any[]>({
    queryKey: ["/api/providers", professionalId, "portfolio"],
    enabled: !!professionalId,
  });

  const { data: availability = [] } = useQuery<any[]>({
    queryKey: ["/api/providers", professionalId, "availability"],
    enabled: !!professionalId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-2xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h2>
              <p className="text-gray-600 mb-6">The provider you're looking for doesn't exist or has been removed.</p>
              <Link href="/search">
                <Button>Browse Other Providers</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = professional.businessName || "Beauty Provider";
  
  const rating = parseFloat(professional.rating || "0");
  const reviewCount = professional.reviewCount || 0;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary to-secondary">
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-end space-x-6">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white">
                  <AvatarImage 
                    src={undefined} 
                    alt={displayName}
                  />
                  <AvatarFallback className="text-2xl">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-4xl font-bold">{displayName}</h1>
                    {professional.isVerified && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Verified className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-lg opacity-90 mb-2">
                    {professional.specialties?.join(" • ") || "Beauty Provider"}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{professional.location}</span>
                    </div>
                    
                    {rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-current text-yellow-400" />
                        <span>{rating.toFixed(1)} ({reviewCount} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {professional.bio || "This provider hasn't added a bio yet."}
                </p>
                
                {/* Contact Info */}
                <div className="mt-6 flex flex-wrap gap-4">
                  {professional.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{professional.phone}</span>
                    </div>
                  )}
                  
                  {professional.website && (
                    <a 
                      href={professional.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                  
                  {professional.instagram && (
                    <a 
                      href={`https://instagram.com/${professional.instagram}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-primary hover:underline"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>@{professional.instagram}</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Services & Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                {services.length > 0 ? (
                  <div className="space-y-4">
                    {services.map((service: any) => (
                      <div key={service.id} className="flex justify-between items-start p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{service.duration} min</span>
                            </div>
                            <Badge variant="outline">{service.category}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">${service.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No services listed yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolio.map((image: any) => (
                      <div key={image.id} className="aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={image.imageUrl} 
                          alt={image.caption || "Portfolio image"}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Reviews ({reviewCount})</span>
                  {rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 fill-current text-yellow-400" />
                      <span className="font-semibold">{rating.toFixed(1)}</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review: any) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                    {reviews.length > 5 && (
                      <Button variant="outline" className="w-full">
                        View All Reviews
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet. Be the first to leave a review!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Book Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional.priceRange && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Starting from</div>
                    <div className="text-2xl font-bold text-primary">{professional.priceRange}</div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Button 
                    className="w-full gradient-primary"
                    onClick={() => setLocation(`/booking/${id}`)}
                  >
                    Book Now
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    Send Message
                  </Button>
                </div>
                
                {/* Quick Stats */}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{reviewCount}</div>
                    <div className="text-xs text-gray-600">Reviews</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{rating.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            {availability.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This Week's Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availability.map((slot: any) => (
                      <div key={slot.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{dayNames[slot.dayOfWeek]}</span>
                        <span className="text-gray-600">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust Badges */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Verified className="h-4 w-4 text-green-600" />
                    <span>Background Verified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-blue-600" />
                    <span>Licensed Professional</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>Trusted by {reviewCount}+ clients</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
