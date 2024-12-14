import { memo, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getMediaFile } from '@/lib/actions/video-actions'

export const VideoComponent = memo(function VideoComponent({
  filePath,
  customDescription,
  className,
}: {
  filePath: string;
  customDescription?: string;
  className?: string;
}) {
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAudio, setIsAudio] = useState(false);

  const sanitizeFilePath = useCallback((path: string): string => {
    const isWindows = navigator.userAgent.includes("Windows");
    if (isWindows) {
      return path; // no sanitization on windows
    }
    return path
      .replace(/^["']|["']$/g, "")
      .trim()
      .replace(/\//g, "/");
  }, []);

  const renderFileLink = () => (
    // TODO button open link
    <p className={"mt-2 text-center text-xs text-gray-500"}>
      {customDescription || filePath}
    </p>
  );

  const getMimeType = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "ogg":
        return "video/ogg";
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      default:
        return isAudio ? "audio/mpeg" : "video/mp4";
    }
  };

  useEffect(() => {
    async function loadMedia() {
      try {
        console.log("Loading media:", filePath);
        const sanitizedPath = sanitizeFilePath(filePath);
        console.log("Sanitized path:", sanitizedPath);
        if (!sanitizedPath) {
          throw new Error("Invalid file path");
        }

        setIsAudio(
          sanitizedPath.toLowerCase().includes("input") ||
            sanitizedPath.toLowerCase().includes("output")
        );

        const { data, mimeType } = await getMediaFile(sanitizedPath);
        const binaryData = atob(data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        setMediaSrc(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Failed to load media:", error);
        setError(
          `Failed to load media: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    loadMedia();
    return () => {
      if (mediaSrc) URL.revokeObjectURL(mediaSrc);
    };
  }, [filePath, sanitizeFilePath]);

  if (error) {
    return (
      <div className="w-full p-4 bg-red-100 border border-red-300 rounded-md">
        <p className="text-red-700">{error}</p>
        {renderFileLink()}
      </div>
    );
  }

  if (!mediaSrc) {
    return (
      <div
        className={cn(
          "w-full h-48 bg-gray-200 animate-pulse rounded-md flex items-center justify-center",
          className
        )}
      >
        <span className="text-gray-500">Loading media...</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-2xl text-center", className)}>
      {isAudio ? (
        <div className="bg-gray-100 p-4 rounded-md">
          <audio controls className="w-full">
            <source src={mediaSrc} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : (
        <video controls className="w-full rounded-md">
          <source src={mediaSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      {renderFileLink()}
    </div>
  );
});