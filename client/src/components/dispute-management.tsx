import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  Send,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface DisputeManagementProps {
  bookingId?: string;
  userId?: string;
}

interface DisputeFormData {
  reason: string;
  description: string;
  amount: number;
  disputantType: 'client' | 'provider';
}

export default function DisputeManagement({ bookingId, userId }: DisputeManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  const [formData, setFormData] = useState<DisputeFormData>({
    reason: "",
    description: "",
    amount: 0,
    disputantType: "client"
  });

  const currentUserId = userId || user?.id;

  // Fetch user disputes
  const { data: disputes, isLoading: disputesLoading } = useQuery({
    queryKey: [`/api/users/${currentUserId}/disputes`],
    enabled: !!currentUserId,
  });

  // Fetch specific dispute details
  const { data: disputeDetails } = useQuery({
    queryKey: [`/api/disputes/${selectedDispute}`],
    enabled: !!selectedDispute,
  });

  // Create dispute mutation
  const createDisputeMutation = useMutation({
    mutationFn: async (disputeData: DisputeFormData) => {
      if (!bookingId) throw new Error("Booking ID required");
      return apiRequest("POST", `/api/bookings/${bookingId}/dispute`, disputeData);
    },
    onSuccess: () => {
      toast({
        title: "Dispute Created",
        description: "Your dispute has been submitted and will be reviewed by our team.",
      });
      setShowCreateForm(false);
      setFormData({
        reason: "",
        description: "",
        amount: 0,
        disputantType: "client"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/disputes`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create dispute",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ disputeId, message }: { disputeId: string; message: string }) => {
      return apiRequest("POST", `/api/disputes/${disputeId}/messages`, { message });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/disputes/${selectedDispute}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'investigating': return <Clock className="h-4 w-4" />;
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleCreateDispute = () => {
    if (!formData.reason || !formData.description || formData.amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createDisputeMutation.mutate(formData);
  };

  const handleSendMessage = () => {
    if (!selectedDispute || !newMessage.trim()) return;
    sendMessageMutation.mutate({ 
      disputeId: selectedDispute, 
      message: newMessage.trim() 
    });
  };

  const disputeReasons = [
    { value: "service_quality", label: "Service Quality Issue" },
    { value: "no_show", label: "Provider No-Show" },
    { value: "billing_error", label: "Billing Error" },
    { value: "cancellation_fee", label: "Unfair Cancellation Fee" },
    { value: "damaged_property", label: "Damaged Property" },
    { value: "unprofessional_behavior", label: "Unprofessional Behavior" },
    { value: "other", label: "Other" },
  ];

  if (disputesLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Dispute Management</h2>
        </div>
        
        {bookingId && (
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                File Dispute
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  File a Dispute
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Dispute</Label>
                  <Select 
                    value={formData.reason} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {disputeReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide details about the issue..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Dispute Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disputantType">Filing as</Label>
                  <Select 
                    value={formData.disputantType} 
                    onValueChange={(value: 'client' | 'provider') => setFormData(prev => ({ ...prev, disputantType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="provider">Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateDispute}
                    disabled={createDisputeMutation.isPending}
                    className="flex-1"
                  >
                    {createDisputeMutation.isPending ? 'Creating...' : 'Submit Dispute'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Disputes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disputes && disputes.length > 0 ? (
                disputes.map((dispute: any) => (
                  <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDispute === dispute.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDispute(dispute.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(dispute.status)}
                        <span className="font-medium">
                          {disputeReasons.find(r => r.value === dispute.reason)?.label || dispute.reason}
                        </span>
                      </div>
                      <Badge className={getStatusColor(dispute.status)}>
                        {dispute.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {dispute.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {format(new Date(dispute.createdAt), 'MMM dd, yyyy')}
                      </span>
                      <span className="font-medium">
                        ${parseFloat(dispute.amount).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No disputes filed</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Any disputes you file will appear here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dispute Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Dispute Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disputeDetails ? (
              <div className="space-y-4">
                {/* Dispute Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {disputeReasons.find(r => r.value === disputeDetails.reason)?.label || disputeDetails.reason}
                    </h3>
                    <Badge className={getStatusColor(disputeDetails.status)}>
                      {disputeDetails.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {disputeDetails.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Amount: <span className="font-medium">${parseFloat(disputeDetails.amount).toFixed(2)}</span></span>
                    <span>Filed: {format(new Date(disputeDetails.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                <Separator />

                {/* Messages */}
                <div className="space-y-3">
                  <h4 className="font-medium">Messages</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {disputeDetails.messages && disputeDetails.messages.length > 0 ? (
                      disputeDetails.messages.map((message: any) => (
                        <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {message.senderType}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No messages yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Send Message */}
                {disputeDetails.status === 'open' || disputeDetails.status === 'investigating' ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a dispute to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}