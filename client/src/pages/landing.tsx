import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Shield, Lock, Headphones, Search, Calendar, Sparkles, Scissors, Palette, Heart, Waves, Flower2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Professional } from "@shared/schema";
import Navigation from "@/components/navigation";
import { AITranslate, AITranslateHeading, AITranslateParagraph } from "@/components/ai-translate";
import byootifyLogo from "@/assets/Byootify Logo_1753511686735.png";
import byootifyLogoWhite from "@/assets/byootify-logo-white_1753513480403.png";
import spaIconImage from "@/assets/massage-spa-body-treatment_1753530139398.png";
import hairstyleIconImage from "@/assets/hairstyle_1753530328379.png";
import shopIconImage from "@/assets/shop_1753530373221.png";

// Custom Hairstyle Icon Component using the provided image
const HairstyleIcon = ({ className }: { className?: string }) => (
  <img 
    src={hairstyleIconImage} 
    alt="Hairstyle icon"
    className={className}
  />
);

// Custom Spa/Massage Icon Component using the provided image
const SpaIcon = ({ className }: { className?: string }) => (
  <img 
    src={spaIconImage} 
    alt="Spa massage icon"
    className={className}
  />
);

// Custom Shop Icon Component using the provided image
const ShopIcon = ({ className }: { className?: string }) => (
  <img 
    src={shopIconImage} 
    alt="Shop icon"
    className={className}
  />
);

export default function Landing() {
  const { t } = useTranslation();
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: featuredProviders = [] } = useQuery<Professional[]>({
    queryKey: ["/api/providers/featured"],
  });

  // Function to get appropriate icon based on provider's specialties and business name
  const getProviderIcon = (specialties: string[] | null, businessName?: string) => {
    if (!specialties) return Scissors;
    
    // Special cases for specific businesses
    if (businessName && businessName.toLowerCase().includes('beautiful braids by delia')) {
      return HairstyleIcon;
    }
    if (businessName && businessName.toLowerCase().includes('jessie\'s beauty spa')) {
      return SpaIcon;
    }
    if (businessName && businessName.toLowerCase().includes('martin\'s precision cuts')) {
      return ShopIcon;
    }
    
    const specialtyList = specialties.join(' ').toLowerCase();
    
    if (specialtyList.includes('facial') || specialtyList.includes('massage') || specialtyList.includes('spa') || specialtyList.includes('skincare')) {
      return SpaIcon; // Spa/wellness services
    }
    if (specialtyList.includes('braid') || specialtyList.includes('natural hair') || specialtyList.includes('protective')) {
      return Waves; // Braiding/natural hair
    }
    if (specialtyList.includes('haircut') || specialtyList.includes('beard') || specialtyList.includes('barber') || specialtyList.includes('shave')) {
      return Scissors; // Barbering/cutting
    }
    if (specialtyList.includes('makeup') || specialtyList.includes('bridal')) {
      return Palette; // Makeup services
    }
    if (specialtyList.includes('nail')) {
      return Sparkles; // Nail services
    }
    
    return Scissors; // Default
  };

  const handleSearch = () => {
    // Navigate to search page with parameters
    const params = new URLSearchParams();
    if (searchLocation) params.set("location", searchLocation);
    if (selectedService) params.set("category", selectedService);
    if (selectedDate) params.set("date", selectedDate);
    
    window.location.href = `/search?${params.toString()}`;
  };

  const serviceCategories = [
    { icon: Scissors, name: "Hair Styling", category: "hair" },
    { icon: Heart, name: "Braiding", category: "braiding" },
    { icon: Sparkles, name: "Nails", category: "nails" },
    { icon: Palette, name: "Makeup", category: "makeup" },
    { icon: Scissors, name: "Barbering", category: "barbering" },
    { icon: Sparkles, name: "Skincare", category: "skincare" },
  ];

  const hairStyles = [
    { 
      name: "Fresh Cuts", 
      gradient: "from-indigo-200 to-indigo-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/1200x/12/80/fb/1280fba3f9968dfd101c63984d0e8d57.jpg')] bg-cover bg-center"
    },
    { 
      name: "Braids", 
      gradient: "from-amber-300 to-amber-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/736x/ff/c0/ac/ffc0ac170063afae00d570c69bf47510.jpg')] bg-cover bg-center"
    },
    { 
      name: "Natural Hair", 
      gradient: "from-amber-100 to-amber-200", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/1200x/5e/48/1c/5e481c1564d506edb07e34ddb356ac9a.jpg')] bg-cover bg-center"
    },
    { 
      name: "Twists", 
      gradient: "from-gray-600 to-gray-800", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/564x/a3/89/97/a38997b1f1bbee3b9c7e301a4c8b8e8b.jpg')] bg-cover bg-center"
    },
    { 
      name: "Dreadlocks", 
      gradient: "from-amber-200 to-amber-300", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/736x/5a/ed/97/5aed9742177b0d94c4fc87e3c3d6b26f.jpg')] bg-cover bg-center"
    },
    { 
      name: "Short & Sweet", 
      gradient: "from-blue-200 to-blue-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i0.wp.com/www.perfektionhair.com/wp-content/uploads/2024/05/4990f4341aa76d359ab4b57f66f67a08.jpg?fit=736%2C736&ssl=1')] bg-cover bg-center"
    },
    { 
      name: "Cornrows", 
      gradient: "from-orange-200 to-orange-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/1200x/e5/af/e0/e5afe0ab4d745feff4ae9aececcb6c34.jpg')] bg-cover bg-center"
    },
    { 
      name: "Bantu Knots", 
      gradient: "from-purple-200 to-purple-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/736x/cb/00/56/cb005608b0f85a8804a165ba2b526b73.jpg')] bg-cover bg-center"
    },
    { 
      name: "Wigs", 
      gradient: "from-pink-200 to-pink-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/1200x/95/f2/37/95f2376bed9d36ea3e7079e9325db867.jpg')] bg-cover bg-center"
    },
    { 
      name: "Weave", 
      gradient: "from-green-200 to-green-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/1200x/05/5f/98/055f989c10b44f4742862b34768bf356.jpg')] bg-cover bg-center"
    },
    { 
      name: "Nail Care", 
      gradient: "from-teal-200 to-teal-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/1200x/f5/a3/78/f5a3787cacfa07bcf75373fe476093e5.jpg')] bg-cover bg-center"
    },
    { 
      name: "Face Beat", 
      gradient: "from-rose-200 to-rose-400", 
      overlay: "from-black/60 to-black/40",
      bgPattern: "bg-[url('https://i.pinimg.com/736x/a9/8f/55/a98f55c988205714d31d46384045c331.jpg')] bg-cover bg-center"
    },
  ];

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(hairStyles.length / 4));
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [hairStyles.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative gradient-hero text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              {t('landing.hero.title', 'Staying Beautiful')}<br />
              <span className="text-secondary">{t('landing.hero.titleStress', 'Shouldn\'t be Stressful')}</span>
            </h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto font-monomakh font-bold tracking-wider">
              {t('landing.hero.subtitle', 'BEAUTY SERVICES, SIMPLIFIED!')}
            </p>
            
            {/* Search Bar */}
            <Card className="max-w-4xl mx-auto shadow-xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('search.filters.service', 'Service')}</label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('search.filters.service', 'Service')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hair">{t('search.services.hair', 'Hair Styling')}</SelectItem>
                        <SelectItem value="braiding">{t('search.services.braiding', 'Hair Braiding')}</SelectItem>
                        <SelectItem value="nails">{t('search.services.nails', 'Nail Services')}</SelectItem>
                        <SelectItem value="makeup">{t('search.services.makeup', 'Makeup')}</SelectItem>
                        <SelectItem value="barbering">{t('search.services.barbering', 'Barbering')}</SelectItem>
                        <SelectItem value="skincare">{t('search.services.skincare', 'Skincare')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('search.filters.location', 'Location')}</label>
                    <Input
                      placeholder={t('search.filters.location', 'Enter your location')}
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('booking.dateTime.selectDate')}</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSearch}
                      className="w-full bg-secondary hover:bg-secondary/90 text-white"
                    >
                      {t('landing.hero.findProviders', 'Find Providers')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <AITranslateHeading 
              as="h3" 
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Featured Beauty Providers
            </AITranslateHeading>
            <AITranslateParagraph className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover top-rated providers in your area, verified and ready to transform your look.
            </AITranslateParagraph>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProviders.map((provider: Professional) => {
              const IconComponent = getProviderIcon(provider.specialties, provider.businessName || undefined);
              return (
              <Card key={provider.id} className="overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <IconComponent className="h-16 w-16 text-primary/50" />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {provider.businessName || "Provider"}
                    </h4>
                    <div className="flex items-center space-x-1 text-accent">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{provider.rating || "5.0"}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{provider.specialties?.join(" • ") || "Beauty Provider"}</p>
                  
                  <div className="flex items-center text-gray-500 mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{provider.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{provider.reviewCount || 0}</span> <AITranslate>reviews</AITranslate>
                    </div>
                    <div className="text-lg font-semibold text-primary">{provider.priceRange || "$50-100"}</div>
                  </div>
                  
                  <Link href={`/provider/${provider.id}`}>
                    <Button className="w-full">
                      <AITranslate>View Profile & Book</AITranslate>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <AITranslateHeading 
              as="h3" 
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Explore Beauty Services
            </AITranslateHeading>
            <p className="text-lg text-gray-600">{t('landing.services.description', 'Find providers for every beauty need')}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {serviceCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link 
                  key={category.category} 
                  href={`/search?category=${category.category}`}
                  className="text-center group cursor-pointer"
                >
                  <Card className="p-6 group-hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <IconComponent className="h-8 w-8 text-primary mb-3 mx-auto" />
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Birth of an Idea - Our Story */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-secondary font-semibold mb-2 uppercase tracking-wide">Birth of an Idea</p>
            <h3 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h3>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              B-yoo-ti-fy ~ (coming from beautify: the act or process of making something beautiful) is an online platform aimed to simplify and bridge the gap between beauty service providers and their customers.
            </p>
          </div>

          {/* Hair Style Gallery - Scrolling Carousel */}
          <div className="mt-16 relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: Math.ceil(hairStyles.length / 4) }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {hairStyles.slice(slideIndex * 4, (slideIndex + 1) * 4).map((style, index) => (
                      <div key={index} className="relative group cursor-pointer hover:scale-105 transition-transform duration-300">
                        <div className={`aspect-square rounded-lg overflow-hidden ${style.bgPattern} bg-cover bg-center`}>
                          <div className={`w-full h-full bg-gradient-to-br ${style.overlay} flex items-end p-6 group-hover:bg-opacity-70 transition-all duration-300`}>
                            <h4 className="text-white text-xl font-semibold drop-shadow-2xl tracking-wide">{style.name}</h4>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil(hairStyles.length / 4) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'w-8 bg-secondary' 
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* View All Services Button */}
            <div className="flex justify-center mt-8">
              <Link href="/search">
                <Button 
                  variant="outline" 
                  className="px-8 py-3 text-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  View All Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.howItWorks.title', 'How It Works')}</h3>
            <p className="text-lg text-gray-600">{t('landing.howItWorks.description', 'Book your perfect beauty service in three simple steps')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('landing.howItWorks.step1', '1. Search & Discover')}</h4>
              <p className="text-gray-600">{t('landing.howItWorks.step1Desc', 'Browse verified providers in your area. Filter by service type, price, availability, and reviews to find your perfect match.')}</p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-secondary" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('landing.howItWorks.step2', '2. Book Instantly')}</h4>
              <p className="text-gray-600">{t('landing.howItWorks.step2Desc', 'View real-time availability and book your appointment instantly. Choose your preferred date, time, and specific services with transparent pricing.')}</p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('landing.howItWorks.step3', '3. Enjoy & Review')}</h4>
              <p className="text-gray-600">{t('landing.howItWorks.step3Desc', 'Relax and enjoy your beauty service. Pay securely through the app and leave a review to help others discover amazing providers.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.safety.title', 'Your Safety is Our Priority')}</h3>
            <p className="text-lg text-gray-600">{t('landing.safety.description', 'We verify every professional and ensure secure transactions')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <CardContent className="p-0">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('landing.safety.verified', 'Verified Professionals')}</h4>
                <p className="text-gray-600">{t('landing.safety.verifiedDesc', 'All professionals undergo background checks and skill verification before joining our platform.')}</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 text-center">
              <CardContent className="p-0">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('landing.safety.secure', 'Secure Payments')}</h4>
                <p className="text-gray-600">{t('landing.safety.secureDesc', 'Your payment information is protected with bank-level encryption and fraud protection.')}</p>
              </CardContent>
            </Card>
            
            <Card className="p-8 text-center">
              <CardContent className="p-0">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">{t('landing.safety.support', '24/7 Support')}</h4>
                <p className="text-gray-600">{t('landing.safety.supportDesc', 'Our customer support team is available around the clock to help resolve any issues.')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action for Professionals */}
      <section id="for-professionals" className="py-16 gradient-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.professional.title', 'Are You a Beauty Professional?')}</h3>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            {t('landing.professional.description', 'Join thousands of beauty professionals who have grown their business with Byootify. Get more clients, manage bookings effortlessly, and build your reputation.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">75%</div>
              <div className="text-sm opacity-80">{t('landing.professional.revenueIncrease', 'Average revenue increase')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">10k+</div>
              <div className="text-sm opacity-80">{t('landing.professional.activeProfessionals', 'Active professionals')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-sm opacity-80">{t('landing.professional.bookingAvailability', 'Booking availability')}</div>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-white text-primary hover:bg-gray-100 font-semibold text-lg px-8 py-4"
          >
{t('landing.professional.joinButton', 'Join as a Professional')}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <img 
                src={byootifyLogoWhite} 
                alt="Byootify - Simplify the Beauty Process" 
                className="h-16 mb-4"
              />
              <p className="text-gray-400 mb-4">Connecting beauty professionals with clients for seamless booking experiences.</p>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold mb-4">For Clients</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Find Professionals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Book Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold mb-4">For Professionals</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Join as Professional</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business Tools</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Byootify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
