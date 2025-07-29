import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: {
    id: number;
    rating: number;
    comment?: string;
    createdAt: string;
    clientId: string;
    client?: {
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const clientName = review.client?.firstName && review.client?.lastName 
    ? `${review.client.firstName} ${review.client.lastName}`
    : "Anonymous";

  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={review.client?.profileImageUrl || undefined} 
              alt={clientName}
            />
            <AvatarFallback>
              {clientName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{clientName}</h4>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating 
                        ? "fill-current text-yellow-400" 
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{reviewDate}</p>
            
            {review.comment && (
              <p className="text-gray-700">{review.comment}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
