import { Github, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SearchHistoryProps {
  history: string[];
  onSelect: (url: string) => void;
}

export function SearchHistory({ history, onSelect }: SearchHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10"
        >
          <History className="h-4 w-4" />
          <span className="sr-only">Search history</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        {history.map((url, index) => (
          <DropdownMenuItem 
            key={index}
            onClick={() => onSelect(url)}
            className="flex items-center cursor-pointer"
          >
            <Github className="mr-2 h-4 w-4" />
            <span className="truncate">{url}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}