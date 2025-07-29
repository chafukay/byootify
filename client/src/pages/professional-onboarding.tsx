import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, MapPin, Phone, Globe, Instagram, 
  Scissors, Palette, Heart, Sparkles, 
  DollarSign, Clock, ArrowRight, Check
} from "lucide-react";

const onboardingSchema = z.object({
  businessName: z.string().optional(),
  bio: z.string().min(50, "Bio should be at least 50 characters").max(500, "Bio should not exceed 500 characters"),
  specialties: z.array(z.string()).min(1, "Please select at least one specialty"),
  location: z.string().min(1, "Location is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  priceRange: z.string().min(1, "Price range is required"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function ProfessionalOnboarding() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create your professional profile.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, authLoading, toast]);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: "",
      bio: "",
      specialties: [],
      location: "",
      address: "",
      phone: "",
      website: "",
      instagram: "",
      priceRange: "",
    },
  });

  const createProfessionalMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const response = await apiRequest("POST", "/api/professionals", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionals"] });
      toast({
        title: "Profile Created!",
        description: "Your professional profile has been created successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Profile Creation Failed",
        description: "Failed to create your professional profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const specialtyOptions = [
    { id: "hair-styling", label: "Hair Styling", icon: Scissors },
    { id: "hair-braiding", label: "Hair Braiding", icon: Heart },
    { id: "nail-services", label: "Nail Services", icon: Sparkles },
    { id: "makeup", label: "Makeup", icon: Palette },
    { id: "barbering", label: "Barbering", icon: Scissors },
    { id: "skincare", label: "Skincare/Esthetics", icon: Sparkles },
    { id: "lash-services", label: "Lash Services", icon: Sparkles },
    { id: "brow-services", label: "Brow Services", icon: Sparkles },
  ];

  const priceRangeOptions = [
    "$25-50",
    "$50-75",
    "$75-100",
    "$100-150",
    "$150-200",
    "$200+",
  ];

  const handleSpecialtyToggle = (specialtyId: string) => {
    const currentSpecialties = form.getValues("specialties");
    const newSpecialties = currentSpecialties.includes(specialtyId)
      ? currentSpecialties.filter(id => id !== specialtyId)
      : [...currentSpecialties, specialtyId];
    
    form.setValue("specialties", newSpecialties);
  };

  const onSubmit = (data: OnboardingFormData) => {
    createProfessionalMutation.mutate(data);
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate step 1 fields
      const bio = form.getValues("bio");
      const specialties = form.getValues("specialties");
      
      if (!bio || bio.length < 50) {
        form.setError("bio", { message: "Bio should be at least 50 characters" });
        return;
      }
      
      if (specialties.length === 0) {
        form.setError("specialties", { message: "Please select at least one specialty" });
        return;
      }
      
      setStep(2);
    } else if (step === 2) {
      // Validate step 2 fields
      const location = form.getValues("location");
      const priceRange = form.getValues("priceRange");
      
      if (!location) {
        form.setError("location", { message: "Location is required" });
        return;
      }
      
      if (!priceRange) {
        form.setError("priceRange", { message: "Price range is required" });
        return;
      }
      
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create Your Professional Profile
          </h1>
          <p className="text-lg text-gray-600">
            Join thousands of beauty professionals growing their business with Byootify
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > 1 ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <span className={step >= 1 ? 'text-primary font-medium' : 'text-gray-600'}>
                  Profile & Specialties
                </span>
              </div>
              
              <div className="flex-1 mx-4 h-px bg-gray-200"></div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > 2 ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <span className={step >= 2 ? 'text-primary font-medium' : 'text-gray-600'}>
                  Location & Pricing
                </span>
              </div>
              
              <div className="flex-1 mx-4 h-px bg-gray-200"></div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className={step >= 3 ? 'text-primary font-medium' : 'text-gray-600'}>
                  Contact & Review
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Profile & Specialties */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Tell Us About Yourself
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Maya's Hair Studio"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell potential clients about your experience, training, and what makes you unique. This helps clients understand your expertise and style."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          {field.value?.length || 0}/500 characters (minimum 50)
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialties"
                    render={() => (
                      <FormItem>
                        <FormLabel>Your Specialties</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {specialtyOptions.map((specialty) => {
                            const IconComponent = specialty.icon;
                            const isSelected = form.watch("specialties").includes(specialty.id);
                            
                            return (
                              <div
                                key={specialty.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors text-center ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleSpecialtyToggle(specialty.id)}
                              >
                                <IconComponent className={`h-8 w-8 mx-auto mb-2 ${
                                  isSelected ? 'text-primary' : 'text-gray-400'
                                }`} />
                                <p className={`text-sm font-medium ${
                                  isSelected ? 'text-primary' : 'text-gray-700'
                                }`}>
                                  {specialty.label}
                                </p>
                                <Checkbox
                                  checked={isSelected}
                                  className="mt-2"
                                  onChange={() => handleSpecialtyToggle(specialty.id)}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Location & Pricing */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Atlanta, GA or Downtown Los Angeles"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Main St, City, State 12345"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typical Price Range</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {priceRangeOptions.map((range) => (
                            <div
                              key={range}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                                field.value === range
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => field.onChange(range)}
                            >
                              <DollarSign className={`h-5 w-5 mx-auto mb-1 ${
                                field.value === range ? 'text-primary' : 'text-gray-400'
                              }`} />
                              <p className={`text-sm font-medium ${
                                field.value === range ? 'text-primary' : 'text-gray-700'
                              }`}>
                                {range}
                              </p>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 3: Contact & Review */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information & Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(555) 123-4567"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://yourwebsite.com"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Handle (Optional)</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              @
                            </span>
                            <Input 
                              placeholder="yourusername"
                              className="rounded-l-none"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profile Preview */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">Profile Preview</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-lg">
                          {form.watch("businessName") || "Your Professional Profile"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch("specialties").map(specialtyId => {
                            const specialty = specialtyOptions.find(s => s.id === specialtyId);
                            return specialty ? (
                              <Badge key={specialtyId} variant="secondary">
                                {specialty.label}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {form.watch("location") || "Location"}
                      </div>
                      
                      {form.watch("priceRange") && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {form.watch("priceRange")}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600 mt-3">
                        {form.watch("bio") || "Your professional bio will appear here..."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <div>
                {step > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                  >
                    Previous
                  </Button>
                )}
              </div>
              
              <div>
                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="gradient-primary"
                    disabled={createProfessionalMutation.isPending}
                  >
                    {createProfessionalMutation.isPending ? "Creating Profile..." : "Create Profile"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
