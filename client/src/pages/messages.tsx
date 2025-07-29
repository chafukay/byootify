import { useParams } from "wouter";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import MessagingSystem from "@/components/messaging-system";

export default function Messages() {
  const { conversationId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-200px)]">
          <MessagingSystem conversationId={conversationId} />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}