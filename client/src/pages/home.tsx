import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import ProfessionalCard from "@/components/professional-card";
import SearchBar from "@/components/search-bar";
import AIRecommendations from "@/components/ai-recommendations";
import { Calendar, Clock, Star, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "wouter";
import type { Professional, Booking } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  
  const { data: featuredProfessionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/professionals/featured"],
  });

  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my"],
  });

  const { data: myProfessionalProfile } = useQuery({
    queryKey: ["/api/professionals/me"],
  });

  const upcomingBooking = myBookings.find((booking: Booking) => 
    new Date(booking.appointmentDate) > new Date() && booking.status === 'confirmed'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Find your perfect beauty service or manage your appointments</p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <SearchBar />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/search">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm">Book Now</span>
                    </Button>
                  </Link>
                  
                  <Link href="/bookings">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                      <Clock className="h-6 w-6" />
                      <span className="text-sm">My Bookings</span>
                    </Button>
                  </Link>
                  
                  <Link href="/favorites">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                      <Star className="h-6 w-6" />
                      <span className="text-sm">Favorites</span>
                    </Button>
                  </Link>
                  
                  {!myProfessionalProfile ? (
                    <Link href="/onboarding/professional">
                      <Button className="w-full h-20 flex flex-col items-center gap-2 gradient-primary">
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-sm">Become Pro</span>
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard">
                      <Button className="w-full h-20 flex flex-col items-center gap-2 gradient-primary">
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-sm">Dashboard</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Professionals */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Professionals Near You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredProfessionals.slice(0, 4).map((professional: Professional) => (
                    <ProfessionalCard key={professional.id} professional={professional} />
                  ))}
                </div>
                
                {featuredProfessionals.length > 4 && (
                  <div className="mt-6 text-center">
                    <Link href="/search">
                      <Button variant="outline">View All Professionals</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Booking */}
            {upcomingBooking && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Appointment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{upcomingBooking.professionalName}</p>
                        <p className="text-sm text-gray-600">{upcomingBooking.serviceName}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Confirmed
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>{new Date(upcomingBooking.appointmentDate).toLocaleDateString()}</p>
                      <p>{new Date(upcomingBooking.appointmentDate).toLocaleTimeString()}</p>
                    </div>
                    
                    <Button size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Dashboard Link */}
            {myProfessionalProfile && (
              <Card className="gradient-primary text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Your Business</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm opacity-90">
                      You have a professional profile. Manage your bookings and grow your business.
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span>{myProfessionalProfile.rating || "New"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reviews:</span>
                        <span>{myProfessionalProfile.reviewCount || 0}</span>
                      </div>
                    </div>
                    
                    <Link href="/dashboard">
                      <Button variant="secondary" size="sm" className="w-full">
                        View Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Become a Professional CTA */}
            {!myProfessionalProfile && (
              <Card className="gradient-secondary text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Are You a Beauty Professional?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm opacity-90">
                      Join thousands of professionals growing their business with Byootify.
                    </p>
                    
                    <ul className="text-sm space-y-1 opacity-90">
                      <li>• Get more clients</li>
                      <li>• Manage bookings easily</li>
                      <li>• Grow your reputation</li>
                    </ul>
                    
                    <Link href="/onboarding/professional">
                      <Button variant="secondary" size="sm" className="w-full">
                        Join as Professional
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
