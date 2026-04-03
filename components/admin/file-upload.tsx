import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FileUploadProps {
  uploadedFiles: File[];
  onFileUpload: (files: FileList) => void;
  onFileRemove: (index: number) => void;
}

export function FileUpload({
  uploadedFiles,
  onFileUpload,
  onFileRemove,
}: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files);
    }
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <Label className="text-sm font-medium">
        Upload Files (JSON, MDX, MD)
      </Label>
      <div className="relative">
        <input
          type="file"
          accept=".json,.mdx,.md"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          multiple
        />
        <Label
          htmlFor="file-upload"
          className="flex items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JSON, MDX, or Markdown files
            </p>
          </div>
        </Label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Uploaded Files:
          </p>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted p-3 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
