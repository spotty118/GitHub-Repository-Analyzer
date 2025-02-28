import { Link2 } from "lucide-react"; // Using Link2 instead of Share2
import { Button } from "@/components/ui/button"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { shareContent } from "@/services/sharing-service";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  disabled?: boolean;
  files?: File[];
}

export function ShareButton({ title, text, url, disabled = false, files }: ShareButtonProps) {
  const { toast } = useToast();
  
  const handleShare = async () => {
    try {
      const result = await shareContent({
        title,
        text,
        url: url || window.location.href,
        files
      });
      
      if (result.success) {
        // Customize toast based on which sharing method was used
        if (result.method === 'clipboard' || result.method === 'legacy-clipboard') {
          toast({ 
            title: "Link copied to clipboard",
            description: "The share link has been copied to your clipboard" 
          });
        } else if (result.method.startsWith('native')) {
          // Successfully shared via native sharing dialog
          toast({ 
            title: "Shared successfully",
            description: "Content has been shared" 
          });
        }
      } else {
        // Sharing failed
        toast({ 
          title: "Sharing failed",
          description: "There was an error sharing this content",
          variant: "destructive"
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
            <Link2 className="h-4 w-4" />
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