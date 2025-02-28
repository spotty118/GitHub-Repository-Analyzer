import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  disabled?: boolean;
}

export function ShareButton({ title, text, url, disabled = false }: ShareButtonProps) {
  const { toast } = useToast();
  
  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        toast({ 
          title: "Link copied to clipboard",
          description: "The share link has been copied to your clipboard" 
        });
      }
    } catch (error) {
      console.error("Error sharing content:", error);
      toast({ 
        title: "Sharing failed",
        description: "There was an error sharing this content",
        variant: "destructive"
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleShare}
            className="hover:text-mint"
            disabled={disabled}
          >
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share analysis</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}