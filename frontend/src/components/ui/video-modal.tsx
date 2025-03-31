// src/components/ui/video-modal.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, Download, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoModalProps {
  children: React.ReactNode;
  src: string;
  alt?: string;
  poster?: string;
}

export function VideoModal({ children, src, alt = "Vídeo", poster }: VideoModalProps) {
  const [open, setOpen] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'video';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(!muted);
    }
  };

  // Quando o modal abrir, começar a reprodução automática
  React.useEffect(() => {
    if (open && videoRef.current) {
      // Pequeno timeout para garantir que o modal está completamente aberto
      const timeout = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.warn('Erro ao reproduzir vídeo automaticamente:', err);
          });
        }
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl p-0 bg-transparent border-0 overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <Button 
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
              size="icon"
              onClick={toggleMute}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button 
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
              size="icon"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white p-0"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center h-full w-full overflow-auto bg-black/90 rounded-lg">
            <div className="p-4 max-h-[90vh] w-full relative">
              <video
                ref={videoRef}
                src={src}
                poster={poster}
                controls
                className="max-w-full max-h-[80vh] mx-auto rounded-lg"
                onError={(e) => {
                  console.error(`Erro ao carregar vídeo no modal: ${src}`);
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}