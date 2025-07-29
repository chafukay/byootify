import { useParams } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import VideoConsultation from "@/components/video-consultation";

export default function VideoCall() {
  const { callId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <VideoConsultation callId={callId} />
      <Footer />
    </div>
  );
}