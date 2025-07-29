import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  GraduationCap, BookOpen, Award, Users, Clock, Star,
  PlayCircle, FileText, CheckCircle, TrendingUp, Calendar
} from "lucide-react";
import { motion } from "framer-motion";

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: number;
  price: number;
  rating: number;
  enrolledCount: number;
  thumbnail: string;
  modules: CourseModule[];
  isEnrolled?: boolean;
  progress?: number;
}

interface CourseModule {
  id: number;
  title: string;
  duration: number;
  isCompleted?: boolean;
  type: 'video' | 'text' | 'quiz';
}

export default function ByootifyUniversity() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Sample courses data (would come from API)
  const courses: Course[] = [
    {
      id: 1,
      title: "Advanced Hair Cutting Techniques",
      description: "Master precision cutting, layering, and texturizing for all hair types",
      instructor: "Maria Rodriguez, Master Stylist",
      category: "hair",
      level: "Advanced",
      duration: 180,
      price: 199,
      rating: 4.9,
      enrolledCount: 1247,
      thumbnail: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400",
      modules: [
        { id: 1, title: "Precision Cutting Fundamentals", duration: 45, type: 'video' },
        { id: 2, title: "Layering Techniques", duration: 30, type: 'video' },
        { id: 3, title: "Advanced Texturizing", duration: 25, type: 'video' },
        { id: 4, title: "Final Assessment", duration: 20, type: 'quiz' }
      ]
    },
    {
      id: 2,
      title: "Color Theory and Application",
      description: "Comprehensive guide to hair coloring, from basics to advanced techniques",
      instructor: "David Chen, Color Specialist",
      category: "hair",
      level: "Intermediate",
      duration: 240,
      price: 299,
      rating: 4.8,
      enrolledCount: 892,
      thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
      modules: [
        { id: 1, title: "Color Wheel Fundamentals", duration: 30, type: 'video' },
        { id: 2, title: "Mixing Techniques", duration: 45, type: 'video' },
        { id: 3, title: "Application Methods", duration: 60, type: 'video' },
        { id: 4, title: "Color Correction", duration: 40, type: 'video' }
      ]
    },
    {
      id: 3,
      title: "Professional Makeup Artistry",
      description: "From basic application to editorial looks, master the art of makeup",
      instructor: "Sarah Kim, Celebrity MUA",
      category: "makeup",
      level: "Beginner",
      duration: 300,
      price: 399,
      rating: 4.9,
      enrolledCount: 2103,
      thumbnail: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400",
      modules: [
        { id: 1, title: "Skin Preparation", duration: 30, type: 'video' },
        { id: 2, title: "Foundation Application", duration: 45, type: 'video' },
        { id: 3, title: "Eye Makeup Techniques", duration: 60, type: 'video' },
        { id: 4, title: "Advanced Contouring", duration: 40, type: 'video' }
      ]
    },
    {
      id: 4,
      title: "Business Management for Beauty Professionals",
      description: "Learn to run a successful beauty business with marketing and client management",
      instructor: "Amanda Wilson, Business Coach",
      category: "business",
      level: "Intermediate",
      duration: 120,
      price: 149,
      rating: 4.7,
      enrolledCount: 756,
      thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
      modules: [
        { id: 1, title: "Setting Up Your Business", duration: 30, type: 'video' },
        { id: 2, title: "Marketing Strategies", duration: 35, type: 'video' },
        { id: 3, title: "Client Management", duration: 25, type: 'video' },
        { id: 4, title: "Financial Planning", duration: 30, type: 'text' }
      ]
    }
  ];

  const categories = [
    { id: "all", name: "All Courses", count: courses.length },
    { id: "hair", name: "Hair Styling", count: courses.filter(c => c.category === 'hair').length },
    { id: "makeup", name: "Makeup", count: courses.filter(c => c.category === 'makeup').length },
    { id: "business", name: "Business", count: courses.filter(c => c.category === 'business').length }
  ];

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return apiRequest("POST", `/api/university/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Successful",
        description: "You've been enrolled in the course. Start learning now!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/university/my-courses"] });
    },
    onError: (error) => {
      toast({
        title: "Enrollment Failed",
        description: "There was an error enrolling in this course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">Byootify University</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advance your beauty career with professional courses from industry experts. 
            Earn certifications and grow your skills with our comprehensive training programs.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">{courses.length}</div>
              <div className="text-sm text-gray-600">Total Courses</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {courses.reduce((sum, course) => sum + course.enrolledCount, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Students Enrolled</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {courses.filter(c => c.rating >= 4.8).length}
              </div>
              <div className="text-sm text-gray-600">Top Rated Courses</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(courses.reduce((sum, course) => sum + course.duration, 0) / 60)}
              </div>
              <div className="text-sm text-gray-600">Hours of Content</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="browse">Browse Courses</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.name} ({category.count})
                  </Button>
                ))}
              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">{course.level}</Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {course.description}
                          </p>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          by {course.instructor}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.round(course.duration / 60)}h {course.duration % 60}m
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {course.rating}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.enrolledCount.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-2xl font-bold text-primary">
                            ${course.price}
                          </div>
                          <Button
                            onClick={() => enrollMutation.mutate(course.id)}
                            disabled={enrollMutation.isPending}
                          >
                            {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Learning Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Enrolled Courses
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start your learning journey by enrolling in a course from our catalog.
                  </p>
                  <Button onClick={() => window.location.hash = "#browse"}>
                    Browse Courses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Certificates Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Complete courses to earn certificates and showcase your skills.
                  </p>
                  <Button onClick={() => window.location.hash = "#browse"}>
                    Start Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}