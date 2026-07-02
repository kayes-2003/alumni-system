import { useRef, useState, useCallback } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploaderProps {
  currentUrl: string | null;
  name: string;
  uploading: boolean;
  onUpload: (file: File) => Promise<string | null>;
  onRemove: () => Promise<boolean>;
}

export function AvatarUploader({
  currentUrl, name, uploading, onUpload, onRemove,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      const result = await onUpload(file);
      if (!result) setPreview(null);
      else URL.revokeObjectURL(objectUrl);
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = async () => {
    setPreview(null);
    await onRemove();
  };

  const displayUrl = preview ?? currentUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Drop zone */}
      <div
        className={`relative rounded-full transition-all duration-200 ${
          dragging ? "ring-4 ring-primary ring-offset-4 scale-105" : ""
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Avatar
          src={displayUrl}
          fallback={name}
          size="xl"
          className="h-28 w-28 text-2xl ring-4 ring-background shadow-lg"
        />

        {/* Overlay button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
          title="Change photo"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {uploading ? "Uploading…" : "Upload Photo"}
        </Button>
        {displayUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP · Max 2MB · Drag &amp; drop supported
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
