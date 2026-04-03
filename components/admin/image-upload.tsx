import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  imageUrl: string;
  uploadedImage: File | null;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  onImageUrlChange: (url: string) => void;
}

export function ImageUpload({
  imageUrl,
  uploadedImage,
  onImageUpload,
  onImageRemove,
  onImageUrlChange,
}: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="imageUrl" className="text-sm font-medium">
        Course Image URL or Upload
      </Label>
      <div className="space-y-3">
        <Input
          id="imageUrl"
          type="text"
          placeholder="https://example.com/image.jpg or S3 key"
          value={
            imageUrl &&
            typeof imageUrl === "string" &&
            !imageUrl.startsWith("data:")
              ? imageUrl
              : ""
          }
          onChange={(e) => onImageUrlChange(e.target.value)}
          className="h-10"
        />
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <Label
            htmlFor="image-upload"
            className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition"
          >
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploadedImage ? uploadedImage.name : "Click to upload image"}
            </span>
          </Label>
        </div>
        {uploadedImage && (
          <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
            <span className="text-sm font-medium">{uploadedImage.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onImageRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
