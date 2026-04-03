import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getS3PublicUrl } from "@/lib/s3-utils";

interface CoursePreviewProps {
  title: string;
  category: string;
  level: string;
  price: string;
  instructor: string;
  imageUrl: string;
}

export function CoursePreview({
  title,
  category,
  level,
  price,
  instructor,
  imageUrl,
}: CoursePreviewProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-base">Course Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl ? (
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted/40">
            <img
              src={getS3PublicUrl(imageUrl)}
              alt="Course preview"
              className="w-full h-full object-contain p-3"
              onError={(e) => {
                console.error(
                  "Failed to load image:",
                  getS3PublicUrl(imageUrl),
                );
                e.currentTarget.src = "";
              }}
            />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center">
            <span className="text-sm text-muted-foreground">No image yet</span>
          </div>
        )}

        <div className="space-y-3 text-sm">
          {title && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Title</p>
              <p className="font-medium line-clamp-2">{title}</p>
            </div>
          )}

          {category && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <p className="font-medium">{category}</p>
            </div>
          )}

          {level && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Level</p>
              <p className="font-medium">{level}</p>
            </div>
          )}

          {price && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Price</p>
              <p className="font-medium">${price}</p>
            </div>
          )}

          {instructor && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Instructor</p>
              <p className="font-medium">{instructor}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
