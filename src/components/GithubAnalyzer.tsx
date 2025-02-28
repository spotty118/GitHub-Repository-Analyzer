import { useState, useEffect, useCallback, useMemo } from "react";
import { Github, FolderTree, Copy, Download, Key, MessageSquare, Info, Code2, Link2, Star, GitBranch, FileCode, LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { exportMarkdown, exportText } from "@/services/sharing-service";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ShareButton } from "@/components/ShareButton";
import { cn } from "@/lib/utils";
import { CacheManager } from "@/components/CacheManager";
import { RepoStats, GitHubResponse, GitHubTreeResponse, GitHubContentResponse, GitHubTreeItem } from "@/types/github";
import { SearchHistory } from "./SearchHistory";

const OPENROUTER_MODELS = [{
  value: "openai/gpt-4o-2024-08-06",
  label: "GPT-4 Turbo (Aug 2024)"
}, {
  value: "openai/gpt-4o-2024-05-13",
  label: "GPT-4 Turbo (May 2024)"
}, {
  value: "openai/gpt-4o-mini-2024-07-18",
  label: "GPT-4 Turbo Mini"
}, {
  value: "openai/chatgpt-4o-latest",
  label: "ChatGPT-4 Latest"
}, {
  value: "openai/o1-preview-2024-09-12",
  label: "O1 Preview"
}, {
  value: "openai/o1-mini-2024-09-12",
  label: "O1 Mini"
}, {
  value: "anthropic/claude-3.7-sonnet",
  label: "Claude 3.7 Sonnet"
}, {
  value: "anthropic/claude-3.7-sonnet:thinking",
  label: "Claude 3.7 Sonnet (Thinking)"
}, {
  value: "anthropic/claude-3.5-sonnet",
  label: "Claude 3.5 Sonnet"
}, {
  value: "anthropic/claude-3.5-haiku",
  label: "Claude 3.5 Haiku"
}, {
  value: "anthropic/claude-3-opus",
  label: "Claude 3 Opus"
}, {
  value: "anthropic/claude-2.1",
  label: "Claude 2.1"
}, {
  value: "google/gemini-pro-1.5",
  label: "Gemini Pro 1.5"
}, {
  value: "google/gemini-flash-1.5",
  label: "Gemini Flash 1.5"
}, {
  value: "mistralai/mistral-large-2407",
  label: "Mistral Large"
}, {
  value: "mistralai/mistral-nemo",
  label: "Mistral Nemo"
}, {
  value: "deepseek/deepseek-r1",
  label: "Deepseek R1"
}, {
  value: "meta-llama/llama-3.1-70b-instruct",
  label: "Llama 3.1 70B"
}, {
  value: "meta-llama/llama-3.1-405b-instruct",
  label: "Llama 3.1 405B"
}, {
  value: "mistralai/mixtral-8x22b-instruct",
  label: "Mixtral 8x22B"
}, {
  value: "cohere/command-r-plus",
  label: "Command-R Plus"
}, {
  value: "cohere/command-r",
  label: "Command-R"
}];

const DEFAULT_AI_ROLE = `You are an expert software architect and code reviewer who specializes in analyzing GitHub repositories.

Technical Requirements:
- React and TypeScript expertise
- Tailwind CSS for styling
- shadcn/ui component library integration
- Modern web development best practices

Link Self-Awareness:
- Identify and validate repository links
- Analyze cross-file dependencies
- Track component relationships
- Monitor import/export patterns
- Evaluate code coupling`;

interface AIModelResponse {
  choices: {
    message: { content: string };
  }[];
}
// Import the cache service
import { cacheService } from "@/services/cache-service";



export const GithubAnalyzer = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const [analysis, setAnalysis] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState("");
  const [fileStructure, setFileStructure] = useState<string>("");
  const [useModelOverride, setUseModelOverride] = useState(false);
  const [selectedModel, setSelectedModel] = useState(OPENROUTER_MODELS[0].value);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [aiRole, setAiRole] = useState<string>(DEFAULT_AI_ROLE);
  const [provider, setProvider] = useState<"openai" | "openrouter">("openrouter");
  const [apiError, setApiError] = useState<Error | null>(null);
  // Memoize expensive model options
  const sortedModels = useMemo(() => {
    return [...OPENROUTER_MODELS].sort((a, b) => a.label.localeCompare(b.label));
  }, []);
  
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const [codeSnippets, setCodeSnippets] = useState<string>("");
  
  const { toast } = useToast();
  
  useEffect(() => {
    if (provider === "openai") {
      setUseModelOverride(false);
    }
  }, [provider]);

  // Load search history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('repoSearchHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed);
        }
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }

    // Listen for storage events (for search history updates from other components)
    const handleStorageChange = () => {
      const updatedHistory = localStorage.getItem('repoSearchHistory');
      if (updatedHistory) {
        try {
          const parsed = JSON.parse(updatedHistory);
          if (Array.isArray(parsed)) {
            setSearchHistory(parsed);
          }
        } catch (e) {
          console.error('Failed to parse updated search history:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  useEffect(() => {
    const savedKey = localStorage.getItem(`${provider}_key`);
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
    } else {
      setIsKeySet(false);
      setApiKey("");
    }
  }, [provider]);
  
  const extractRepoInfo = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return {
          owner: pathParts[0],
          repo: pathParts[1]
        };
      }
      throw new Error("Invalid repository URL format");
    } catch (error) {
      throw new Error("Please enter a valid GitHub repository URL");
    }
  };
  
  const handleSaveKey = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: `Please enter a valid ${provider === "openai" ? "OpenAI" : "OpenRouter"} API key`,
        variant: "destructive"
      });
      return;
    }
    localStorage.setItem(`${provider}_key`, apiKey);
    setIsKeySet(true);
    toast({
      title: "Success",
      description: "API key saved successfully"
    });
  }, [apiKey, provider, toast]);
  
  const handleRemoveKey = useCallback(() => {
    localStorage.removeItem(`${provider}_key`);
    setApiKey("");
    setIsKeySet(false);
    toast({
      title: "Removed",
      description: "API key removed successfully"
    });
  }, [provider, toast]);
  
  const resetAnalysisState = () => {
    setApiError(null);
    setProgressPercent(0);
    setProgressStage("");
    setFileStructure("");
    setAnalysis("");
    setCustomInstructions("");
    setRepoStats(null);
    setCodeSnippets("");
  };
  
  const handleUrlSelect = useCallback((url: string) => {
    setRepoUrl(url);
  }, []);
  
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKeySet || !repoUrl) {
      toast({
        title: "Error",
        description: !isKeySet ? `Please set your ${provider === "openai" ? "OpenAI" : "OpenRouter"} API key first` : "Please enter a GitHub repository URL",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    resetAnalysisState();
    
    try {
      // Add URL to search history if it's not already there
      if (!searchHistory.includes(repoUrl)) {
        const newHistory = [repoUrl, ...searchHistory.filter(url => url !== repoUrl)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('repoSearchHistory', JSON.stringify(newHistory));
      }

      const { owner, repo } = extractRepoInfo(repoUrl);
      
      // Add URL components to search history if it's not already there
      const { owner: repoOwner, repo: repoName } = extractRepoInfo(repoUrl);
      
      // Fetch repository metadata
      setProgressStage("Fetching repository information");
      setProgressPercent(10);
      const stats = await fetchRepositoryStats(owner, repo);
      setRepoStats(stats);
      
      // Fetch repository structure
      setProgressStage("Loading file structure");
      setProgressPercent(25);
      const repoStructure = await fetchRepositoryStructure(owner, repo, stats.defaultBranch);
      setFileStructure(repoStructure);
      
      // Fetch code snippets
      setProgressStage("Analyzing code snippets");
      setProgressPercent(40);
      const snippets = await fetchCodeSnippets(owner, repo, stats.defaultBranch);
      setCodeSnippets(snippets);
      
      // First API call for analysis
      setProgressStage("Generating repository analysis");
      setProgressPercent(60);
      const analysisText = await generateAnalysis(owner, repo, repoStructure, stats);
      setAnalysis(analysisText);
      
      // Second API call for instructions
      setProgressStage("Creating custom development guidelines");
      setProgressPercent(85);
      const instructions = await generateInstructions(owner, repo, snippets);
      setCustomInstructions(instructions);
      
      setProgressPercent(100);
      toast({
        title: "Analysis Complete",
        description: "Repository analyzed successfully"
      });
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Analysis failed";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      setApiError(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
      setProgressStage("");
    }
  };
  
  const fetchRepositoryStats = async (owner: string, repo: string): Promise<RepoStats> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      const cacheKey = cacheService.getCacheKey(owner, repo, "stats");
      
      // Check cache first
      const cachedStats = cacheService.getCache<RepoStats>(cacheKey);
      if (cachedStats) return cachedStats;
      
      if (!response.ok) {
        throw new Error(`Failed to fetch repository stats: ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch repository stats: ${response.statusText}`);
      }
      
      const data = await response.json() as GitHubResponse;
      
      const stats = {
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        watchers: data.watchers_count || 0,
        defaultBranch: data.default_branch || 'main',
        openIssues: data.open_issues_count || 0,
        language: data.language || 'Unknown',
        createdAt: new Date(data.created_at).toLocaleDateString(),
        updatedAt: new Date(data.updated_at).toLocaleDateString()
      };
      
      // Cache the result
      cacheService.setCache(cacheKey, stats);
      
      return stats;
    } catch (error) {
      console.error("Error fetching repository stats:", error);
      throw error;
    }
  };
  
  const fetchRepositoryStructure = async (owner: string, repo: string, defaultBranch: string): Promise<string> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
      const cacheKey = cacheService.getCacheKey(owner, repo, `structure-${defaultBranch}`);
      
      // Check cache first
      const cachedStructure = cacheService.getCache<GitHubTreeResponse>(cacheKey);
      if (cachedStructure) 
        return cachedStructure.tree.filter(item => item.type === "blob").map(item => item.path).join('\n');
      
      if (!response.ok) {
        // Try with master branch if specified branch doesn't exist
        const masterResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
        
        if (!masterResponse.ok) {
          throw new Error("Failed to fetch repository data");
        }
        
        const data = await masterResponse.json() as GitHubTreeResponse;
        return (data.tree as GitHubTreeItem[])
          .filter(item => item.type === "blob")
          .map(item => item.path)
          .join('\n');
      }
      
      const data = await response.json() as GitHubTreeResponse;
      
      // Cache the result
      cacheService.setCache(cacheKey, data);
      return (data.tree as GitHubTreeItem[])
        .filter(item => item.type === "blob")
        .map(item => item.path)
        .join('\n');
    } catch (error) {
      console.error("Error fetching repository structure:", error);
      throw error;
    }
  };
  
  // Function to fetch important code snippets (like package.json, README, etc.)
  const fetchCodeSnippets = async (owner: string, repo: string, branch: string): Promise<string> => {
    try {
      // Array of important files to check (expand as needed)
      const cacheKey = cacheService.getCacheKey(owner, repo, `snippets-${branch}`);
      
      // Check cache for code snippets using the specialized string cache method
      const cachedSnippets = cacheService.getCacheString(cacheKey);
      if (cachedSnippets) return cachedSnippets;

      const importantFiles = [
        "package.json",
        "README.md",
        ".github/workflows/main.yml",
        "tsconfig.json",
        "src/index.ts",
        "src/index.js",
        "src/App.tsx",
        "src/App.jsx"
      ];
      
      let snippets = "";
      
      // Try to fetch each file and add to snippets
      for (const file of importantFiles) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${file}?ref=${branch}`
          );
          
          if (response.ok) {
            const data = await response.json() as GitHubContentResponse;
            
            // GitHub API returns content as base64 encoded
            if (data.content && data.encoding === "base64") {
              const content = atob(data.content.replace(/\n/g, ""));
              
              // Add file header and content to snippets
              snippets += `\n--- ${file} ---\n\n`;
              
              // Truncate large files
              const maxLines = 50;
              const lines = content.split("\n");
              if (lines.length > maxLines) {
                snippets += lines.slice(0, maxLines).join("\n");
                snippets += `\n... (${lines.length - maxLines} more lines) ...\n`;
              } else {
                snippets += content;
              }
              
              snippets += "\n\n";
            }
          }
        } catch (error) {
          // Just skip files that don't exist - no need to throw
          console.log(`File ${file} not found or couldn't be accessed`);
        }
      }
      
      if (snippets.trim() === "") {
        return "No key files found or accessible in this repository.";
      }
      
      // Cache the result
      cacheService.setCacheString(cacheKey, snippets);
      
      return snippets;
    } catch (error) {
      console.error("Error fetching code snippets:", error);
      return "Error fetching code snippets. Some files may be inaccessible.";
    }
  };
  
  const generateAnalysis = useCallback(async (owner: string, repo: string, structure: string, stats: RepoStats): Promise<string> => {
    const endpoint = provider === "openai" ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === "openrouter" && {
        'HTTP-Referer': window.location.origin
      })
    };
    
    const modelConfig = provider === "openai" ? {
      model: "gpt-4o"
    } : {
      model: useModelOverride ? selectedModel : 'openrouter/auto'
    };
    
    console.log('Using model config:', modelConfig);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...modelConfig,
        messages: [{
          role: 'system',
          content: aiRole
        }, {
          role: 'user',
          content: `${owner}/${repo}

Repository Info:
Stars: ${stats.stars} | Forks: ${stats.forks} | Language: ${stats.language} | Updated: ${stats.updatedAt}

${structure}

Analyze with focus on:
1. Architecture
2. Code Structure
3. Technical Stack
4. Dependencies
5. Enhancement Points`
        }]
      })
    });
    
    // Handle rate limiting and retry logic
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait and retry
        toast({
          title: "Rate Limited",
          description: "API rate limit reached. Retrying in 5 seconds...",
          variant: "default"
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        return generateAnalysis(owner, repo, structure, stats);
      } else {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.statusText}. ${errorText}`);
      }
    }
    
    const data = await response.json() as AIModelResponse;
    return data.choices[0].message.content;
  }, [apiKey, provider, aiRole, selectedModel, useModelOverride, toast]);
  
  const generateInstructions = async (owner: string, repo: string, snippets: string): Promise<string> => {
    const endpoint = provider === "openai" ? 'https://api.openai.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === "openrouter" && {
        'HTTP-Referer': window.location.origin
      })
    };
    
    const modelConfig = provider === "openai" ? {
      model: "gpt-4o"
    } : {
      model: useModelOverride ? selectedModel : 'openrouter/auto'
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...modelConfig,
        messages: [{
          role: 'system',
          content: "Generate IDE-compatible development guidelines based on the codebase analysis."
        }, {
          role: 'user',
          content: `Based on ${owner}/${repo} analysis:

I have analyzed these key files:
${snippets.split('\n').slice(0, 10).join('\n')}...

Generate development guidelines for IDE AI assistance:
1. Architecture patterns to follow
2. Code style and organization
3. Testing requirements
4. Performance considerations
5. Security requirements`
        }]
      })
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait and retry
        toast({
          title: "Rate Limited",
          description: "API rate limit reached. Retrying in 5 seconds...",
          variant: "default"
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        return generateInstructions(owner, repo, snippets);
      } else {
        const errorText = await response.text();
        throw new Error(`Guidelines generation failed: ${response.statusText}. ${errorText}`);
      }
    }
    
    const data = await response.json() as AIModelResponse;
    return data.choices[0].message.content;
  };
  
  const handleCopy = useCallback(() => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      toast({
        title: "Copied!",
        description: "Analysis copied to clipboard"
      });
    }
  }, [analysis, toast]);
  
  const handleMarkdownExport = useCallback(() => {
    if (analysis) {
      exportMarkdown(repoUrl, analysis, customInstructions, repoStats);
      toast({
        title: "Exported!",
        description: "Analysis exported as markdown file"
      });
    }
  }, [analysis, customInstructions, repoStats, repoUrl, toast]);
  
  const handleExport = useCallback(() => {
    if (analysis) {
      exportText(repoUrl, analysis);
      toast({
        title: "Exported!",
        description: "Analysis exported as text file"
      });
    }
  }, [analysis, repoUrl, toast]);
  
  // Reset the error state when trying again
  const handleResetError = () => {
    setApiError(null);
  };
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-4xl font-bold text-center text-foreground">
          GitHub Repository Analyzer
          </h1>
          {repoStats && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center"><Star className="w-4 h-4 mr-1" /> {repoStats.stars}</span>
              <span className="flex items-center"><GitBranch className="w-4 h-4 mr-1" /> {repoStats.forks}</span>
              <span className="flex items-center"><FileCode className="w-4 h-4 mr-1" /> {repoStats.language}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-mint" />
                  <h2 className="text-xl font-semibold">API Configuration</h2>
                </div>

                <Select value={provider} onValueChange={(value: "openai" | "openrouter") => setProvider(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select API Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
                
                <form onSubmit={handleSaveKey} className="flex space-x-2">
                  <Input type="password" placeholder={`Enter ${provider === "openai" ? "OpenAI" : "OpenRouter"} API key`} value={apiKey} onChange={e => setApiKey(e.target.value)} className="flex-1" />
                  {!isKeySet ? (
                    <Button type="submit" className="bg-mint hover:bg-mint-light text-white">
                      Save Key
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleRemoveKey} className="hover:text-destructive">
                      Remove Key
                    </Button>
                  )}
                </form>

                {provider === "openrouter" && <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="model-override" checked={useModelOverride} onCheckedChange={setUseModelOverride} />
                        <Label htmlFor="model-override">Use Model Override</Label>
                      </div>
                      
                      {useModelOverride && <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedModels.map(model => <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>}
                    </div>
                    
                    {useModelOverride && <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Different models have varying capabilities, response times, and costs. If analysis seems slow, the selected model might have longer processing times. Faster models may provide less detailed analysis.
                        </AlertDescription>
                      </Alert>}
                  </div>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-mint" />
                    <h2 className="text-xl font-semibold">AI Role Configuration</h2>
                  </div>
                </div>
                <Textarea placeholder="Enter the role/persona for the AI analyzer" value={aiRole} onChange={e => setAiRole(e.target.value)} className="min-h-[200px] font-mono text-sm" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Github className="w-5 h-5 text-mint" />
                  <h2 className="text-xl font-semibold">Repository Input</h2>
                </div>
                
                <form onSubmit={handleAnalyze} className="flex space-x-2 relative">
                  <div className="relative flex-1">
                    <Input 
                      placeholder="Enter GitHub repository URL" 
                      value={repoUrl} 
                      onChange={e => setRepoUrl(e.target.value)} 
                      className={cn("flex-1", searchHistory.length > 0 && "pl-10")}
                    />
                    {searchHistory.length > 0 && (
                      <SearchHistory 
                        history={searchHistory} 
                        onSelect={handleUrlSelect} 
                      />
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-mint hover:bg-mint-light text-white" 
                    disabled={!isKeySet || isLoading}
                  >
                    {isLoading ? "Analyzing..." : "Analyze"}
                  </Button>
                </form>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
                <div className="flex items-center space-x-2">
                  <LoaderCircle className="w-5 h-5 animate-spin text-mint" />
                  <p className="text-lg font-medium">{progressStage || "Analyzing repository..."}</p>
                </div>
                <div className="w-full max-w-md">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-right mt-1 text-muted-foreground">{progressPercent}%</p>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                  <TabsTrigger value="snippets">Code Snippets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Analysis Results</h2>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleCopy} 
                        className="hover:text-mint"
                        disabled={!analysis}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={handleExport} 
                        className="hover:text-mint"
                        disabled={!analysis}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={handleMarkdownExport}
                        className="hover:text-mint"
                        disabled={!analysis}
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative h-[400px] bg-muted rounded-lg">
                    <ErrorBoundary onReset={handleResetError}>
                      <div className="absolute inset-0 p-4 overflow-y-auto">
                        {apiError ? (
                          <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                              {apiError.message}
                            </AlertDescription>
                          </Alert>
                        ) : analysis ? (
                          <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
                        ) : (
                          <p className="text-muted-foreground">
                            Analysis results will appear here...
                          </p>
                        )}
                      </div>
                    </ErrorBoundary>
                  </div>
                </TabsContent>
                
                <TabsContent value="guidelines" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-mint" />
                      <h2 className="text-xl font-semibold">Development Guidelines</h2>
                    </div>
                    <Button 
                      onClick={() => {
                        if (customInstructions) {
                          navigator.clipboard.writeText(customInstructions);
                          toast({
                            title: "Copied!",
                            description: "Custom instructions copied to clipboard"
                          });
                        }
                      }} 
                      className="hover:text-mint" 
                      disabled={!customInstructions}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="relative h-[400px] bg-muted rounded-lg">
                    <ErrorBoundary>
                      <div className="absolute inset-0 p-4 overflow-y-auto">
                        {apiError ? (
                          <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                              {apiError.message}
                            </AlertDescription>
                          </Alert>
                        ) : customInstructions ? (
                          <pre className="whitespace-pre-wrap text-sm">{customInstructions}</pre>
                        ) : (
                          <p className="text-muted-foreground">
                            AI-generated development guidelines will appear here...
                          </p>
                        )}
                      </div>
                    </ErrorBoundary>
                  </div>
                </TabsContent>
                
                <TabsContent value="structure" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FolderTree className="w-5 h-5 text-mint" />
                    <h2 className="text-xl font-semibold">File Structure</h2>
                  </div>
                  <div className="relative h-[400px] bg-muted rounded-lg">
                    <ErrorBoundary>
                      <div className="absolute inset-0 p-4 overflow-y-auto">
                        {apiError ? (
                          <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                              {apiError.message}
                            </AlertDescription>
                          </Alert>
                        ) : fileStructure ? (
                          <pre className="whitespace-pre font-mono text-sm">{fileStructure}</pre>
                        ) : (
                          <p className="text-muted-foreground">
                            Repository structure will appear here...
                          </p>
                        )}
                      </div>
                    </ErrorBoundary>
                  </div>
                </TabsContent>
                
                <TabsContent value="snippets" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-5 h-5 text-mint" />
                    <h2 className="text-xl font-semibold">Code Snippets</h2>
                  </div>
                  <div className="relative h-[400px] bg-muted rounded-lg">
                    <ErrorBoundary>
                      <div className="absolute inset-0 p-4 overflow-y-auto">
                        {apiError ? (
                          <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                              {apiError.message}
                            </AlertDescription>
                          </Alert>
                        ) : codeSnippets ? (
                          <pre className="whitespace-pre-wrap font-mono text-sm">{codeSnippets}</pre>
                        ) : (
                          <p className="text-muted-foreground">
                            Key code snippets will appear here...
                          </p>
                        )}
                      </div>
                    </ErrorBoundary>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </Card>
        </div>
        
        {repoStats && (
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Repository Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Stars</p>
                  <p className="font-medium flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500" /> {repoStats.stars}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Forks</p>
                  <p className="font-medium flex items-center"><GitBranch className="w-4 h-4 mr-1 text-mint" /> {repoStats.forks}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Primary Language</p>
                  <p className="font-medium flex items-center"><FileCode className="w-4 h-4 mr-1 text-blue-500" /> {repoStats.language || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{repoStats.updatedAt}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {repoStats && (
          <Card className="p-6 mt-4">
            {/* Add Cache Manager when a repository has been analyzed */}
            <CacheManager repoOwner={extractRepoInfo(repoUrl).owner} repoName={extractRepoInfo(repoUrl).repo} />
          </Card>
        )}
      </div>
    </div>
  );
};
