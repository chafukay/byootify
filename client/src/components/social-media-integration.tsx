import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Camera, 
  Calendar, 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Hash,
  Image as ImageIcon,
  Video,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

interface SocialMediaIntegrationProps {
  providerId: number;
}

interface SocialAccount {
  platform: 'instagram' | 'facebook' | 'twitter';
  username: string;
  connected: boolean;
  followers: number;
  lastSync: string;
  profilePicture?: string;
}

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  content: string;
  images: string[];
  scheduledAt?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  hashtags: string[];
}

interface ContentTemplate {
  id: string;
  title: string;
  category: 'before_after' | 'behind_scenes' | 'tips' | 'promotion' | 'testimonial';
  content: string;
  hashtags: string[];
  popularity: number;
}

interface SocialAnalytics {
  totalFollowers: number;
  totalEngagement: number;
  averageReach: number;
  bestPostingTimes: string[];
  topHashtags: { tag: string; performance: number }[];
  platformPerformance: {
    platform: string;
    posts: number;
    engagement: number;
    growth: number;
  }[];
}

export default function SocialMediaIntegration({ providerId }: SocialMediaIntegrationProps) {
  const [newPost, setNewPost] = useState({
    content: '',
    images: [] as File[],
    hashtags: [] as string[],
    scheduledAt: '',
    platforms: [] as string[],
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connected social accounts
  const { data: socialAccounts = [], isLoading: accountsLoading } = useQuery<SocialAccount[]>({
    queryKey: ["/api/providers", providerId, "social-accounts"],
  });

  // Fetch social posts
  const { data: socialPosts = [], isLoading: postsLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/providers", providerId, "social-posts"],
  });

  // Fetch content templates
  const { data: contentTemplates = [], isLoading: templatesLoading } = useQuery<ContentTemplate[]>({
    queryKey: ["/api/content-templates"],
  });

  // Fetch social analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<SocialAnalytics>({
    queryKey: ["/api/providers", providerId, "social-analytics"],
  });

  // Connect social account
  const connectAccountMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("POST", `/api/providers/${providerId}/connect-social`, {
        platform
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Connected",
        description: `Your ${data.platform} account has been connected successfully!`,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "social-accounts"]
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Create/schedule social post
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const formData = new FormData();
      formData.append('content', postData.content);
      formData.append('hashtags', JSON.stringify(postData.hashtags));
      formData.append('platforms', JSON.stringify(postData.platforms));
      
      if (postData.scheduledAt) {
        formData.append('scheduledAt', postData.scheduledAt);
      }
      
      postData.images.forEach((image: File, index: number) => {
        formData.append(`images`, image);
      });

      const response = await apiRequest("POST", `/api/providers/${providerId}/social-posts`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your social media post has been created successfully!",
      });
      
      setNewPost({
        content: '',
        images: [],
        hashtags: [],
        scheduledAt: '',
        platforms: [],
      });
      
      queryClient.invalidateQueries({
        queryKey: ["/api/providers", providerId, "social-posts"]
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create posts",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post Creation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'twitter': return <Twitter className="h-5 w-5 text-blue-500" />;
      default: return <Share2 className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !newPost.hashtags.includes(hashtagInput.trim())) {
      setNewPost(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtagInput.trim()]
      }));
      setHashtagInput('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setNewPost(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }));
  };

  const useTemplate = (template: ContentTemplate) => {
    setNewPost(prev => ({
      ...prev,
      content: template.content,
      hashtags: [...template.hashtags],
    }));
    setSelectedTemplate(null);
  };

  if (accountsLoading || postsLoading || templatesLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Social Media Management</h1>
        <p className="text-gray-600">
          Connect your social accounts and manage your content from one place
        </p>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['instagram', 'facebook', 'twitter'].map((platform) => {
              const account = socialAccounts.find(acc => acc.platform === platform);
              
              return (
                <div key={platform} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform)}
                      <span className="font-medium capitalize">{platform}</span>
                    </div>
                    
                    {account?.connected ? (
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => connectAccountMutation.mutate(platform)}
                        disabled={connectAccountMutation.isPending}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                  
                  {account?.connected && (
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>@{account.username}</p>
                      <p>{account.followers.toLocaleString()} followers</p>
                      <p>Last sync: {formatDistanceToNow(new Date(account.lastSync), { addSuffix: true })}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Social Analytics */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.totalFollowers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Followers</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.totalEngagement.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Engagement</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.averageReach.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Average Reach</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.bestPostingTimes[0] || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Best Posting Time</div>
              </motion.div>
            </div>

            {/* Top Hashtags */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Top Performing Hashtags</h4>
              <div className="flex flex-wrap gap-2">
                {analytics.topHashtags.slice(0, 10).map((hashtag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{hashtag.tag} ({hashtag.performance}%)
                  </Badge>
                ))}
              </div>
            </div>

            {/* Platform Performance */}
            <div>
              <h4 className="font-medium mb-3">Platform Performance</h4>
              <div className="space-y-2">
                {analytics.platformPerformance.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(platform.platform)}
                      <span className="capitalize">{platform.platform}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{platform.posts} posts</span>
                      <span>{platform.engagement} engagement</span>
                      <span className={`font-medium ${
                        platform.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {platform.growth >= 0 ? '+' : ''}{platform.growth}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Post */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Post
            </CardTitle>
            
            {/* Content Templates */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Choose Content Template</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {contentTemplates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4" onClick={() => useTemplate(template)}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{template.title}</h4>
                          <Badge variant="outline">
                            {template.popularity}% success rate
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template.content.slice(0, 100)}...</p>
                        <div className="flex flex-wrap gap-1">
                          {template.hashtags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {template.hashtags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.hashtags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Platform Selection */}
          <div>
            <Label className="text-sm font-medium">Platforms</Label>
            <div className="flex gap-3 mt-2">
              {socialAccounts.filter(acc => acc.connected).map((account) => (
                <label key={account.platform} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPost.platforms.includes(account.platform)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewPost(prev => ({
                          ...prev,
                          platforms: [...prev.platforms, account.platform]
                        }));
                      } else {
                        setNewPost(prev => ({
                          ...prev,
                          platforms: prev.platforms.filter(p => p !== account.platform)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  {getPlatformIcon(account.platform)}
                  <span className="capitalize">{account.platform}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Post Content */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium">Post Content</Label>
            <Textarea
              id="content"
              placeholder="What's happening? Share your beauty journey..."
              rows={4}
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-sm font-medium">Images</Label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    setNewPost(prev => ({ ...prev, images: files }));
                  }
                }}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <Camera className="h-4 w-4" />
                <span className="text-sm">Add Images ({newPost.images.length}/10)</span>
              </label>
            </div>

            {/* Image Previews */}
            {newPost.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {newPost.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setNewPost(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div>
            <Label className="text-sm font-medium">Hashtags</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add hashtag (without #)"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                className="flex-1"
              />
              <Button onClick={addHashtag} variant="outline">
                <Hash className="h-4 w-4" />
              </Button>
            </div>
            
            {newPost.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newPost.hashtags.map((hashtag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{hashtag}
                    <button
                      onClick={() => removeHashtag(hashtag)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledAt" className="text-sm font-medium">Schedule For Later</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={newPost.scheduledAt}
                onChange={(e) => setNewPost(prev => ({ ...prev, scheduledAt: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => createPostMutation.mutate(newPost)}
                disabled={createPostMutation.isPending || !newPost.content || newPost.platforms.length === 0}
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                {createPostMutation.isPending ? "Creating..." : newPost.scheduledAt ? "Schedule Post" : "Post Now"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        
        <CardContent>
          {socialPosts.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600">Create your first social media post to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {socialPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(post.platform)}
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                      {post.scheduledAt && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {format(new Date(post.scheduledAt), 'MMM d, h:mm a')}
                        </div>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{post.content}</p>
                  
                  {post.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {post.images.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                      {post.images.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                          +{post.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.hashtags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {post.status === 'published' && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.engagement.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.engagement.comments}
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        {post.engagement.shares}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.engagement.reach} reach
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}