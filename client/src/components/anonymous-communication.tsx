import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Send, 
  MessageCircle, 
  Clock,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Star,
  FileText,
  Image,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnonymousMessage {
  id: number;
  senderType: 'client' | 'provider';
  message: string;
  messageType: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  isRead: boolean;
  sentAt: string;
}

interface AnonymousChannel {
  id: number;
  channelCode: string;
  clientId: string;
  providerId: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

interface AnonymousCommunicationProps {
  channelCode: string;
  userType: 'client' | 'provider';
  userId: string;
}

export default function AnonymousCommunication({ 
  channelCode, 
  userType, 
  userId 
}: AnonymousCommunicationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Fetch channel info
  const { data: channel } = useQuery<AnonymousChannel>({
    queryKey: ['/api/communication/channels', channelCode],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<AnonymousMessage[]>({
    queryKey: ['/api/communication/messages', channelCode],
    refetchInterval: 3000, // Real-time-like updates every 3 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await apiRequest('POST', '/api/communication/messages', messageData);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/communication/messages', channelCode] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rate conversation mutation
  const rateConversationMutation = useMutation({
    mutationFn: async (rating: number) => {
      return await apiRequest('POST', `/api/communication/channels/${channelCode}/rate`, { rating });
    },
    onSuccess: () => {
      toast({
        title: "Thank You",
        description: "Your feedback helps us improve our service.",
      });
    },
  });

  // Request contact info reveal
  const requestContactMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/communication/channels/${channelCode}/request-contact`);
    },
    onSuccess: () => {
      toast({
        title: "Contact Request Sent",
        description: "The other party will be notified of your request.",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate({
      channelCode,
      senderType: userType,
      message: newMessage,
      messageType: 'text'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Anonymous Communication
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Privacy Protected
              </Badge>
            </div>
            {channel?.expiresAt && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Expires {new Date(channel.expiresAt).toLocaleDateString()}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Your personal information is hidden. Messages are encrypted and secure.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContactInfo(!showContactInfo)}
                className="flex items-center gap-1"
              >
                {showContactInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showContactInfo ? 'Hide Contact' : 'Request Contact'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-4">
          <div className="flex-1 overflow-y-auto space-y-4 min-h-96">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.senderType === userType ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderType === userType
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getMessageIcon(message.messageType)}
                      <span className="text-xs opacity-75">
                        {message.senderType === userType ? 'You' : userType === 'client' ? 'Provider' : 'Client'}
                      </span>
                    </div>
                    
                    <div className="break-words">{message.message}</div>
                    
                    {message.attachmentUrl && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => window.open(message.attachmentUrl, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-75 mt-1">
                      {formatTime(message.sentAt)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t pt-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Request Panel */}
      {showContactInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  To maintain privacy, contact information is only shared when both parties agree. 
                  Request contact details for direct communication.
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Email & Phone sharing</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => requestContactMutation.mutate()}
                    disabled={requestContactMutation.isPending}
                  >
                    {requestContactMutation.isPending ? 'Requesting...' : 'Request Contact Info'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rate Conversation */}
      {messages.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rate this conversation:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    size="sm"
                    onClick={() => rateConversationMutation.mutate(rating)}
                    className="p-1"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}