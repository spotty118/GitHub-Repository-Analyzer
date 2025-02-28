import { useState, useEffect, useRef } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchHistoryProps {
  history: string[];
  onSelect: (url: string) => void;
}

export function SearchHistory({ history, onSelect }: SearchHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (history.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <Clock className="h-4 w-4" />
        <span className="sr-only">Search History</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-background border border-input rounded-md shadow-md z-10">
          <ul className="py-1 max-h-[200px] overflow-y-auto">
            {history.map((item, index) => (
              <li key={index} className="px-3 py-2 hover:bg-muted flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                  className="text-sm truncate flex-1 text-left"
                >
                  {item}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newHistory = [...history];
                    newHistory.splice(index, 1);
                    localStorage.setItem('repoSearchHistory', JSON.stringify(newHistory));
                    window.dispatchEvent(new Event('storage'));
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove from history</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}