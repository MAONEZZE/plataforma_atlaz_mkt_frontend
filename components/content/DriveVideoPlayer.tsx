import { cn } from "@/lib/utils";

interface DriveVideoPlayerProps {
  fileId: string;
  className?: string;
}

export function DriveVideoPlayer({ fileId, className }: DriveVideoPlayerProps) {
  return (
    <div className={cn("solid-surface overflow-hidden", className)}>
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        allow="autoplay"
        allowFullScreen
        className="w-full aspect-video border-0"
        title="Vídeo da aula"
      />
    </div>
  );
}
