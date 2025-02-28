import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cacheService } from "@/services/cache-service";
import { Badge } from "@/components/ui/badge"; 
import { Star, LoaderCircle, Info, FileCode } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface CacheManagerProps {
  repoOwner?: string;
  repoName?: string;
}

export const CacheManager = ({ repoOwner, repoName }: CacheManagerProps) => {
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  // Refresh cache stats
  const refreshCacheStats = () => {
    const stats = cacheService.getCacheStats();
    setCacheSize(stats.size);
    setCacheKeys(stats.keys);
    setLastUpdated(new Date());
  };

  // Initial load and refresh
  useEffect(() => {
    refreshCacheStats();
    // Refresh cache stats every 30 seconds
    const interval = setInterval(refreshCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear current repository cache
  const clearRepoCache = () => {
    if (repoOwner && repoName) {
      const clearedCount = cacheService.clearRepoCache(repoOwner, repoName);
      toast({
        title: "Cache Cleared",
        description: `Cleared ${clearedCount} cache entries for ${repoOwner}/${repoName}`,
      });
      refreshCacheStats();
    } else {
      toast({
        title: "No Repository Selected",
        description: "Please analyze a repository first",
        variant: "destructive",
      });
    }
  };

  // Clear all cache
  const clearAllCache = () => {
    const clearedCount = cacheService.clearAllCache();
    toast({
      title: "Cache Cleared",
      description: `Cleared all ${clearedCount} cache entries`,
    });
    refreshCacheStats();
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="h-5 w-5 text-mint" />
            <h3 className="text-lg font-medium">Cache Manager</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshCacheStats}
                  className="h-8 w-8 p-0"
                >
                  <LoaderCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh cache statistics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">Cache Size</span>
            <span className="font-medium">
              {cacheSize} {cacheSize === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="font-medium">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {cacheSize > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {cacheKeys.slice(0, 5).map((key) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key.length > 30 ? key.substring(0, 27) + "..." : key}
              </Badge>
            ))}
            {cacheKeys.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{cacheKeys.length - 5} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearRepoCache}
            disabled={!repoOwner || !repoName}
            className="text-xs"
          >
            <Star className="mr-1 h-3 w-3" />
            Clear Repo Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllCache}
            disabled={cacheSize === 0}
            className="text-xs"
          >
            <Star className="mr-1 h-3 w-3" />
            Clear All Cache
          </Button>
        </div>

        {(repoOwner && repoName) && (
          <div className="text-xs text-muted-foreground text-center mt-2">
            <Info className="inline h-3 w-3 mr-1" />
            Managing cache for {repoOwner}/{repoName}
          </div>
        )}
      </div>
    </Card>
  );
};