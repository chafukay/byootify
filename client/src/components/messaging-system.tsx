import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Send, MessageSquare, Phone, Video, Image, Paperclip, 
  MoreHorizontal, Search, Filter, Star, CheckCircle2
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface MessagingSystemProps {
  conversationId?: string;
  recipientId?: string;
  recipientName?: string;
  recipientAvatar?: string;
  isProvider?: boolean;
}

export default function MessagingSystem({ 
  conversationId, 
  recipientId, 
  recipientName, 
  recipientAvatar,
  isProvider = false 
}: MessagingSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch conversations list
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch messages for active conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
    refetchInterval: 5000, // More frequent updates for active chat
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const formData = new FormData();
      formData.append('content', messageData.content);
      formData.append('conversationId', messageData.conversationId);
      formData.append('recipientId', messageData.recipientId);
      
      selectedFiles.forEach((file, index) => {
        formData.append(`attachments_${index}`, file);
      });

      await apiRequest("POST", "/api/messages", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      setNewMessage("");
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const startVideoCallMutation = useMutation({
    mutationFn: async ({ recipientId }: { recipientId: string }) => {
      const response = await apiRequest("POST", "/api/video-calls/initiate", { recipientId });
      return response.json();
    },
    onSuccess: (callData) => {
      toast({
        title: "Video Call Started",
        description: "Connecting...",
      });
      // Redirect to video call interface
      window.open(`/video-call/${callData.callId}`, '_blank');
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Call",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("PUT", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const unreadMessages = messages.filter((msg: any) => 
        !msg.isRead && msg.senderId !== user?.id
      );
      
      unreadMessages.forEach((msg: any) => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [conversationId, messages, user?.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    
    if (!conversationId && !recipientId) {
      toast({
        title: "No Recipient",
        description: "Please select a conversation or recipient.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      content: newMessage,
      conversationId: conversationId || null,
      recipientId: recipientId || null,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: "Too Many Files",
        description: "Maximum 5 files allowed per message.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getConversationPreview = (conversation: any) => {
    if (!conversation.lastMessage) return "No messages yet";
    
    const content = conversation.lastMessage.content;
    if (content.length > 50) {
      return content.substring(0, 50) + "...";
    }
    return content;
  };

  const filteredConversations = conversations.filter((conv: any) =>
    conv.participantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!conversationId) {
    // Show conversations list
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Search Users</label>
                    <Input
                      placeholder="Search by name or email..."
                      className="mt-1"
                    />
                  </div>
                  <Button className="w-full">Start Conversation</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p>Start a conversation with a client or provider.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation: any) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                  className="p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                  onClick={() => window.location.href = `/messages/${conversation.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.participantAvatar} />
                      <AvatarFallback>
                        {conversation.participantName?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">
                          {conversation.participantName || "Unknown User"}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage && formatMessageTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {getConversationPreview(conversation)}
                      </p>
                      
                      {conversation.lastMessage?.senderId !== user?.id && conversation.unreadCount > 0 && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show conversation messages
  return (
    <div className="h-full flex flex-col">
      {/* Conversation Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback>
                {recipientName?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {recipientName || "Unknown User"}
              </h3>
              <p className="text-sm text-gray-500">
                {isProvider ? "Beauty Provider" : "Client"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startVideoCallMutation.mutate({ recipientId: recipientId! })}
              disabled={startVideoCallMutation.isPending}
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message: any, index: number) => {
            const isOwnMessage = message.senderId === user?.id;
            const showTimestamp = index === 0 || 
              new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5 minutes

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                  {showTimestamp && (
                    <div className="text-center text-xs text-gray-500 mb-2">
                      {formatMessageTime(message.timestamp)}
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment: any, idx: number) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Paperclip className="h-3 w-3" />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline hover:no-underline"
                            >
                              {attachment.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className={`flex items-center space-x-1 mt-1 ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-xs opacity-70">
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </span>
                      {isOwnMessage && message.isRead && (
                        <CheckCircle2 className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
                
                {!isOwnMessage && (
                  <Avatar className="h-8 w-8 order-1 mr-2">
                    <AvatarImage src={recipientAvatar} />
                    <AvatarFallback className="text-xs">
                      {recipientName?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={1}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button type="button" variant="ghost" size="sm" asChild>
                <span className="cursor-pointer">
                  <Paperclip className="h-4 w-4" />
                </span>
              </Button>
            </label>
            
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending || (!newMessage.trim() && selectedFiles.length === 0)}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}