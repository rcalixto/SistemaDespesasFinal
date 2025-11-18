import { useState, useCallback } from "react";
import { Upload, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadSuccess?: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  multiple?: boolean;
}

export function FileUpload({
  onUploadSuccess,
  maxFiles = 5,
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles = multiple 
        ? [...files, ...droppedFiles].slice(0, maxFiles)
        : [droppedFiles[0]];
      
      setFiles(newFiles);
      onUploadSuccess?.(newFiles);
    },
    [files, maxFiles, multiple, onUploadSuccess]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles = multiple 
        ? [...files, ...selectedFiles].slice(0, maxFiles)
        : [selectedFiles[0]];
      
      setFiles(newFiles);
      onUploadSuccess?.(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUploadSuccess?.(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-md p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileInput}
          accept={accept}
          multiple={multiple}
          data-testid="file-input"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center space-y-3"
        >
          <Upload className="w-10 h-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Clique para selecionar ou arraste arquivos aqui
            </p>
            <p className="text-xs text-muted-foreground">
              Máximo de {maxFiles} arquivo(s). {accept}
            </p>
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Arquivos selecionados ({files.length}):
          </p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-card border border-border rounded-md hover-elevate"
              data-testid={`file-item-${index}`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <File className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground truncate">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                className="flex-shrink-0 ml-2"
                data-testid={`remove-file-${index}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
