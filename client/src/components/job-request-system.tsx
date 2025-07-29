import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  User, 
  Send, 
  Eye,
  Heart,
  Home,
  AlertCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Job Request Form Schema
const jobRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  location: z.string().min(3, "Please enter a location"),
  budgetMin: z.number().min(0, "Budget must be positive"),
  budgetMax: z.number().min(0, "Budget must be positive"),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']),
  homeVisitRequired: z.boolean(),
  estimatedDuration: z.string(),
  preferredDateTime: z.string().optional(),
  additionalRequirements: z.string().optional(),
});

type JobRequestFormData = z.infer<typeof jobRequestSchema>;

// Provider Bid Form Schema
const bidSchema = z.object({
  bidAmount: z.number().min(1, "Bid amount must be greater than 0"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  estimatedDuration: z.string().min(1, "Please provide estimated duration"),
  availableDate: z.string().min(1, "Please provide your availability"),
});

type BidFormData = z.infer<typeof bidSchema>;

export function JobRequestSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    category: '',
    budget: '',
    urgency: '',
    homeVisitRequired: false,
  });

  // Job Request Form
  const jobForm = useForm<JobRequestFormData>({
    resolver: zodResolver(jobRequestSchema),
    defaultValues: {
      homeVisitRequired: false,
      urgency: 'medium',
    },
  });

  // Bid Form
  const bidForm = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
  });

  // Fetch job requests
  const { data: jobRequests, isLoading } = useQuery({
    queryKey: ['/api/job-requests', searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await apiRequest('GET', `/api/job-requests?${params}`);
      return response.json();
    },
  });

  // Create job request mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: JobRequestFormData) => {
      const response = await apiRequest('POST', '/api/job-requests', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Posted!",
        description: "Your job request has been posted successfully. Providers will start bidding soon.",
      });
      setCreateJobDialogOpen(false);
      jobForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/job-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Posting Job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async (data: BidFormData & { jobRequestId: string }) => {
      const { jobRequestId, ...bidData } = data;
      const response = await apiRequest('POST', `/api/job-requests/${jobRequestId}/bids`, bidData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Submitted!",
        description: "Your bid has been submitted successfully. The client will review it shortly.",
      });
      setBidDialogOpen(false);
      bidForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/job-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Submitting Bid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const urgencyColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const urgencyIcons = {
    low: Clock,
    medium: Clock,
    high: AlertCircle,
    urgent: AlertCircle
  };

  const categories = [
    'Hair Styling', 'Hair Cutting', 'Braiding', 'Natural Hair Care',
    'Makeup', 'Skincare', 'Nails', 'Barbering', 'Massage', 'Lashes'
  ];

  const handleJobCreate = (data: JobRequestFormData) => {
    createJobMutation.mutate(data);
  };

  const handleBidSubmit = (data: BidFormData) => {
    if (!selectedJob) return;
    submitBidMutation.mutate({ ...data, jobRequestId: selectedJob.id });
  };

  const handleJobView = async (jobId: string) => {
    try {
      const response = await apiRequest('GET', `/api/job-requests/${jobId}`);
      const jobDetails = await response.json();
      setSelectedJob(jobDetails);
      setJobDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Job Marketplace</h1>
          <p className="text-gray-600">
            {user ? 'Find jobs posted by clients or post your own job request' : 'Browse available beauty service jobs'}
          </p>
        </div>
        
        {user && (
          <Dialog open={createJobDialogOpen} onOpenChange={setCreateJobDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Briefcase className="h-4 w-4 mr-2" />
                Post a Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a New Job Request</DialogTitle>
                <DialogDescription>
                  Describe what you're looking for and let providers bid on your job
                </DialogDescription>
              </DialogHeader>
              
              <Form {...jobForm}>
                <form onSubmit={jobForm.handleSubmit(handleJobCreate)} className="space-y-4">
                  <FormField
                    control={jobForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Need a hairstylist for wedding day" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide detailed information about your requirements..." 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={jobForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={jobForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, State or ZIP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={jobForm.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Budget ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="50"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={jobForm.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Budget ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="200"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={jobForm.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select urgency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low - Flexible timing</SelectItem>
                              <SelectItem value="medium">Medium - Within a week</SelectItem>
                              <SelectItem value="high">High - Within 2-3 days</SelectItem>
                              <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={jobForm.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2 hours" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={jobForm.control}
                    name="homeVisitRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Home visit required
                          </FormLabel>
                          <p className="text-sm text-gray-600">
                            Service must be provided at my location
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="preferredDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Date & Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="additionalRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Requirements (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special requirements or preferences..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={createJobMutation.isPending}
                    className="w-full"
                  >
                    {createJobMutation.isPending ? "Posting..." : "Post Job Request"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Location</Label>
              <Input 
                placeholder="City, State"
                value={searchFilters.location}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select 
                value={searchFilters.category}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Budget</Label>
              <Input 
                type="number"
                placeholder="$200"
                value={searchFilters.budget}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, budget: e.target.value }))}
              />
            </div>
            <div>
              <Label>Urgency</Label>
              <Select 
                value={searchFilters.urgency}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, urgency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any urgency</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobRequests?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search filters or check back later for new job postings.
              </p>
              {user && (
                <Button onClick={() => setCreateJobDialogOpen(true)}>
                  Post the First Job
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          jobRequests?.map((job: any) => {
            const UrgencyIcon = urgencyIcons[job.urgency as keyof typeof urgencyIcons];
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {job.category}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${job.budgetMin} - ${job.budgetMax}
                        </Badge>
                        <Badge className={`flex items-center gap-1 ${urgencyColors[job.urgency as keyof typeof urgencyColors]}`}>
                          <UrgencyIcon className="h-3 w-3" />
                          {job.urgency}
                        </Badge>
                        {job.homeVisitRequired && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Home Visit
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {job.bidCount || 0} bids
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleJobView(job.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {user && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job);
                          setBidDialogOpen(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Submit Bid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Job Details Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  Posted by {selectedJob.clientName || 'Client'} • {selectedJob.bidCount || 0} bids received
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{selectedJob.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Job Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>{selectedJob.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedJob.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>${selectedJob.budgetMin} - ${selectedJob.budgetMax}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{selectedJob.estimatedDuration}</span>
                      </div>
                      {selectedJob.homeVisitRequired && (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          <span>Home visit required</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="capitalize">{selectedJob.urgency} priority</span>
                      </div>
                      {selectedJob.preferredDateTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>Preferred: {new Date(selectedJob.preferredDateTime).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedJob.additionalRequirements && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Requirements</h4>
                    <p className="text-gray-600 text-sm">{selectedJob.additionalRequirements}</p>
                  </div>
                )}

                {user && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      onClick={() => {
                        setJobDialogOpen(false);
                        setBidDialogOpen(true);
                      }}
                      className="flex-1"
                    >
                      Submit Your Bid
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bid Submission Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Your Bid</DialogTitle>
            <DialogDescription>
              Provide your best offer for this job
            </DialogDescription>
          </DialogHeader>
          
          <Form {...bidForm}>
            <form onSubmit={bidForm.handleSubmit(handleBidSubmit)} className="space-y-4">
              <FormField
                control={bidForm.control}
                name="bidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Bid Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        step="0.01"
                        placeholder="150.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bidForm.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2-3 hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bidForm.control}
                name="availableDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Availability</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={bidForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain why you're the right person for this job..."
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={submitBidMutation.isPending}
                className="w-full"
              >
                {submitBidMutation.isPending ? "Submitting..." : "Submit Bid"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}