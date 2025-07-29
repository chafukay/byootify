import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PortfolioUploadProps {
  professionalId: number;
  onClose?: () => void;
}

export default function PortfolioUpload({ professionalId, onClose }: PortfolioUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadData, setUploadData] = useState({
    imageUrl: "",
    caption: "",
    category: "",
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadData) => {
      await apiRequest("POST", `/api/providers/${professionalId}/portfolio`, data);
    },
    onSuccess: () => {
      toast({
        title: "Portfolio Image Added",
        description: "Your image has been successfully added to your portfolio.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers", professionalId, "portfolio"] });
      setUploadData({ imageUrl: "", caption: "", category: "" });
      onClose?.();
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload portfolio image.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.imageUrl) {
      toast({
        title: "Image Required",
        description: "Please provide an image URL.",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate(uploadData);
  };

  const serviceCategories = [
    { value: "hair", label: "Hair Styling" },
    { value: "braiding", label: "Braiding" },
    { value: "nails", label: "Nail Art" },
    { value: "makeup", label: "Makeup" },
    { value: "skincare", label: "Skincare" },
    { value: "barbering", label: "Barbering" },
    { value: "other", label: "Other" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Add Portfolio Image
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={uploadData.imageUrl}
                onChange={(e) => setUploadData(prev => ({ ...prev, imageUrl: e.target.value }))}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Paste a URL to your image (from social media, cloud storage, etc.)
              </p>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={uploadData.category}
                onValueChange={(value) => setUploadData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                placeholder="Describe this work..."
                value={uploadData.caption}
                onChange={(e) => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
                rows={3}
              />
            </div>

            {uploadData.imageUrl && (
              <div className="mt-4">
                <Label>Preview</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <img
                    src={uploadData.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={uploadMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending ? "Uploading..." : "Add to Portfolio"}
              </Button>
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}