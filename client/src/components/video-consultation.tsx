import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Share2, 
  Settings, MoreHorizontal, Users, MessageSquare, 
  Camera, CameraOff, Volume2, VolumeX, Monitor, Maximize2
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface VideoConsultationProps {
  callId?: string;
  recipientId?: string;
  recipientName?: string;
  isInitiator?: boolean;
}

export default function VideoConsultation({ 
  callId, 
  recipientId, 
  recipientName,
  isInitiator = false 
}: VideoConsultationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended' | 'failed'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch call details
  const { data: callDetails } = useQuery({
    queryKey: ["/api/video-calls", callId],
    enabled: !!callId,
  });

  const endCallMutation = useMutation({
    mutationFn: async () => {
      if (callId) {
        await apiRequest("POST", `/api/video-calls/${callId}/end`);
      }
    },
    onSuccess: () => {
      cleanup();
      setCallStatus('ended');
      toast({
        title: "Call Ended",
        description: "The video call has been ended.",
      });
    },
  });

  const recordCallMutation = useMutation({
    mutationFn: async ({ duration, quality }: { duration: number; quality: string }) => {
      if (callId) {
        await apiRequest("POST", `/api/video-calls/${callId}/record`, {
          duration,
          quality,
          endTime: new Date().toISOString(),
        });
      }
    },
  });

  // Initialize WebRTC
  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // Add TURN servers for production
        ]
      });

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setCallStatus('connected');
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer via signaling server
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            callId
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setCallStatus('failed');
        }
      };

      setPeerConnection(pc);

      // Start call duration timer
      const timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      toast({
        title: "Camera/Microphone Error",
        description: "Unable to access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
      setCallStatus('failed');
    }
  };

  const sendSignalingMessage = async (message: any) => {
    // In a real implementation, this would send via WebSocket or polling
    try {
      await apiRequest("POST", "/api/video-calls/signaling", message);
    } catch (error) {
      console.error('Signaling error:', error);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      if (peerConnection && localStream) {
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        setIsScreenSharing(true);

        // Handle screen share end
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast({
        title: "Screen Share Failed",
        description: "Unable to start screen sharing.",
        variant: "destructive",
      });
    }
  };

  const stopScreenShare = async () => {
    if (peerConnection && localStream) {
      // Replace screen share with camera
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find(s => 
        s.track?.kind === 'video'
      );
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      setIsScreenSharing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }

    // Record call details
    if (callDuration > 0) {
      recordCallMutation.mutate({
        duration: callDuration,
        quality: 'HD'
      });
    }

    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    initializeWebRTC();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (callStatus === 'ended') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Call Ended</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-gray-600">
              <p>Call duration: {formatDuration(callDuration)}</p>
              <p>Thank you for using our video consultation service.</p>
            </div>
            <Button 
              onClick={() => window.close()}
              className="w-full"
            >
              Close Window
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (callStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Connection Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Unable to establish connection. Please check your internet connection and try again.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Retry Connection
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.close()}
                className="w-full"
              >
                Close Window
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">
            Video Consultation with {recipientName || "User"}
          </h1>
          <Badge variant="secondary" className="bg-green-600 text-white">
            {callStatus === 'connected' ? 'Connected' : 'Connecting...'}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300">
            {formatDuration(callDuration)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-gray-700"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <CameraOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Screen Share Indicator */}
        {isScreenSharing && (
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span className="text-sm">Screen Sharing</span>
          </div>
        )}

        {/* Connection Status */}
        {callStatus === 'connecting' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Card className="p-6 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
              <p className="text-gray-600">Please wait while we establish the connection.</p>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="flex items-center justify-center space-x-4">
          {/* Video Toggle */}
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12 p-0"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Audio Toggle */}
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12 p-0"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "default" : "secondary"}
            size="lg"
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className="rounded-full w-12 h-12 p-0"
          >
            <Share2 className="h-5 w-5" />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={() => endCallMutation.mutate()}
            disabled={endCallMutation.isPending}
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowSettings(true)}
            className="rounded-full w-12 h-12 p-0"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Video Quality</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="radio" name="quality" value="hd" defaultChecked />
                  <span>HD (720p)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" name="quality" value="fhd" />
                  <span>Full HD (1080p)</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Audio Settings</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Noise Suppression</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Echo Cancellation</span>
                </label>
              </div>
            </div>

            <Button onClick={() => setShowSettings(false)} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}