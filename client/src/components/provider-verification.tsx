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
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Shield, 
  Award, 
  Users, 
  FileText, 
  Upload, 
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Phone,
  Mail,
  Calendar,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Certification Form Schema
const certificationSchema = z.object({
  type: z.string().min(1, "Please select certification type"),
  name: z.string().min(3, "Certification name must be at least 3 characters"),
  issuingOrganization: z.string().min(3, "Issuing organization is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
  certificateNumber: z.string().optional(),
  description: z.string().optional(),
  documentUrl: z.string().optional(),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

// Reference Form Schema
const referenceSchema = z.object({
  name: z.string().min(2, "Reference name is required"),
  relationship: z.string().min(3, "Please specify relationship"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().min(10, "Valid phone number is required"),
  yearsKnown: z.number().min(1, "Must have known reference for at least 1 year"),
  workDescription: z.string().min(20, "Please provide detailed work description"),
  notes: z.string().optional(),
});

type ReferenceFormData = z.infer<typeof referenceSchema>;

interface ProviderVerificationProps {
  professionalId: number;
}

export function ProviderVerification({ professionalId }: ProviderVerificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [refDialogOpen, setRefDialogOpen] = useState(false);

  // Forms
  const certForm = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
  });

  const refForm = useForm<ReferenceFormData>({
    resolver: zodResolver(referenceSchema),
  });

  // Fetch certifications
  const { data: certifications, isLoading: certsLoading } = useQuery({
    queryKey: [`/api/providers/${professionalId}/certifications`],
    retry: false,
  });

  // Fetch references
  const { data: references, isLoading: refsLoading } = useQuery({
    queryKey: [`/api/providers/${professionalId}/references`],
    retry: false,
  });

  // Add certification mutation
  const addCertMutation = useMutation({
    mutationFn: async (data: CertificationFormData) => {
      const response = await apiRequest('POST', `/api/providers/${professionalId}/certifications`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certification Added!",
        description: "Your certification has been submitted for verification.",
      });
      setCertDialogOpen(false);
      certForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${professionalId}/certifications`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Certification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add reference mutation
  const addRefMutation = useMutation({
    mutationFn: async (data: ReferenceFormData) => {
      const response = await apiRequest('POST', `/api/providers/${professionalId}/references`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reference Added!",
        description: "Your reference has been submitted for verification.",
      });
      setRefDialogOpen(false);
      refForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${professionalId}/references`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Reference",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const certificationTypes = [
    'Cosmetology License',
    'Barbering License', 
    'Esthetician License',
    'Nail Technician License',
    'Massage Therapy License',
    'Makeup Artist Certification',
    'Hair Specialist Certification',
    'Safety & Sanitation Certificate',
    'CPR/First Aid Certification',
    'Other Professional Certification'
  ];

  const relationshipTypes = [
    'Former Client',
    'Business Partner',
    'Salon Owner/Manager',
    'Fellow Professional',
    'Mentor/Instructor',
    'Employer/Supervisor',
    'Other Professional Contact'
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const calculateVerificationProgress = () => {
    const totalItems = (certifications?.length || 0) + (references?.length || 0);
    const verifiedItems = (certifications?.filter((c: any) => c.status === 'verified').length || 0) + 
                         (references?.filter((r: any) => r.status === 'verified').length || 0);
    
    if (totalItems === 0) return 0;
    return Math.round((verifiedItems / totalItems) * 100);
  };

  const handleCertSubmit = (data: CertificationFormData) => {
    addCertMutation.mutate(data);
  };

  const handleRefSubmit = (data: ReferenceFormData) => {
    addRefMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Provider Verification
          </CardTitle>
          <CardDescription>
            Build trust with clients by verifying your credentials and professional references
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Verification Progress</span>
                <span>{calculateVerificationProgress()}%</span>
              </div>
              <Progress value={calculateVerificationProgress()} className="w-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {certifications?.filter((c: any) => c.status === 'verified').length || 0}
                </div>
                <div className="text-sm text-gray-600">Verified Certifications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {references?.filter((r: any) => r.status === 'verified').length || 0}
                </div>
                <div className="text-sm text-gray-600">Verified References</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {calculateVerificationProgress() >= 80 ? '✓' : calculateVerificationProgress() + '%'}
                </div>
                <div className="text-sm text-gray-600">Trust Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="certifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Professional Certifications</h3>
              <p className="text-sm text-gray-600">
                Add your licenses, certifications, and professional credentials
              </p>
            </div>
            
            <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Award className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Professional Certification</DialogTitle>
                  <DialogDescription>
                    Upload your professional certifications to build trust and credibility
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...certForm}>
                  <form onSubmit={certForm.handleSubmit(handleCertSubmit)} className="space-y-4">
                    <FormField
                      control={certForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select certification type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {certificationTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={certForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., State Board Cosmetology License" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={certForm.control}
                      name="issuingOrganization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Organization</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., State Board of Cosmetology" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={certForm.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={certForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={certForm.control}
                      name="certificateNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="License or certificate number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={certForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional details about this certification..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={certForm.control}
                      name="documentUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Upload (Optional)</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Upload certificate image or PDF
                              </p>
                              <Button type="button" variant="outline" size="sm" className="mt-2">
                                Choose File
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={addCertMutation.isPending}
                      className="w-full"
                    >
                      {addCertMutation.isPending ? "Adding..." : "Add Certification"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Certifications List */}
          <div className="space-y-4">
            {certsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : certifications?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications added</h3>
                  <p className="text-gray-600 mb-4">
                    Add your professional certifications to build trust with clients
                  </p>
                  <Button onClick={() => setCertDialogOpen(true)}>
                    Add Your First Certification
                  </Button>
                </CardContent>
              </Card>
            ) : (
              certifications?.map((cert: any) => (
                <Card key={cert.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{cert.name}</h4>
                          <Badge className={`flex items-center gap-1 ${getStatusColor(cert.status)}`}>
                            {getStatusIcon(cert.status)}
                            {cert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{cert.issuingOrganization}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                          </span>
                          {cert.expiryDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {cert.description && (
                          <p className="text-sm text-gray-600 mt-2">{cert.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="references" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Professional References</h3>
              <p className="text-sm text-gray-600">
                Add at least 2 professional references to complete verification
              </p>
            </div>
            
            <Dialog open={refDialogOpen} onOpenChange={setRefDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Add Reference
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Professional Reference</DialogTitle>
                  <DialogDescription>
                    Add someone who can vouch for your professional skills and character
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...refForm}>
                  <form onSubmit={refForm.handleSubmit(handleRefSubmit)} className="space-y-4">
                    <FormField
                      control={refForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name of your reference" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={refForm.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How do you know this person?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationshipTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={refForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="reference@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={refForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={refForm.control}
                      name="yearsKnown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years Known</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="3"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={refForm.control}
                      name="workDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the work you did together and your professional relationship..."
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={refForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any additional information about this reference..."
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={addRefMutation.isPending}
                      className="w-full"
                    >
                      {addRefMutation.isPending ? "Adding..." : "Add Reference"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* References List */}
          <div className="space-y-4">
            {refsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : references?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No references added</h3>
                  <p className="text-gray-600 mb-4">
                    Add at least 2 professional references to complete your verification
                  </p>
                  <Button onClick={() => setRefDialogOpen(true)}>
                    Add Your First Reference
                  </Button>
                </CardContent>
              </Card>
            ) : (
              references?.map((ref: any) => (
                <Card key={ref.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{ref.name}</h4>
                          <Badge className={`flex items-center gap-1 ${getStatusColor(ref.status)}`}>
                            {getStatusIcon(ref.status)}
                            {ref.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ref.relationship}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {ref.contactEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {ref.contactPhone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Known for {ref.yearsKnown} years
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{ref.workDescription}</p>
                        {ref.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">{ref.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}