
import { useState, useEffect } from "react";
import { Github, FolderTree, Copy, Download, Key, MessageSquare, Info, Code2, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ErrorBoundary from "@/components/ErrorBoundary";

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
export const GithubAnalyzer = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileStructure, setFileStructure] = useState<string>("");
  const [useModelOverride, setUseModelOverride] = useState(false);
  const [selectedModel, setSelectedModel] = useState(OPENROUTER_MODELS[0].value);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [aiRole, setAiRole] = useState<string>(DEFAULT_AI_ROLE);
  const [provider, setProvider] = useState<"openai" | "openrouter">("openrouter");
  const [apiError, setApiError] = useState<Error | null>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (provider === "openai") {
      setUseModelOverride(false);
    }
  }, [provider]);
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
  const handleSaveKey = (e: React.FormEvent) => {
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
  };
  const handleRemoveKey = () => {
    localStorage.removeItem(`${provider}_key`);
    setApiKey("");
    setIsKeySet(false);
    toast({
      title: "Removed",
      description: "API key removed successfully"
    });
  };
  
  const resetAnalysisState = () => {
    setApiError(null);
    setFileStructure("");
    setAnalysis("");
    setCustomInstructions("");
  };
  
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
      const {
        owner,
        repo
      } = extractRepoInfo(repoUrl);
      
      // Fetch repository structure
      const repoStructure = await fetchRepositoryStructure(owner, repo);
      setFileStructure(repoStructure);
      
      // First API call for analysis
      const analysisText = await generateAnalysis(owner, repo, repoStructure);
      setAnalysis(analysisText);
      
      // Second API call for instructions
      const instructions = await generateInstructions(owner, repo);
      setCustomInstructions(instructions);
      
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
    }
  };
  
  const fetchRepositoryStructure = async (owner: string, repo: string): Promise<string> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`);
      
      if (!response.ok) {
        // Try with master branch if main doesn't exist
        const masterResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
        
        if (!masterResponse.ok) {
          throw new Error("Failed to fetch repository data");
        }
        
        const data = await masterResponse.json();
        return data.tree
          .filter((item: any) => item.type === "blob")
          .map((item: any) => item.path)
          .join('\n');
      }
      
      const data = await response.json();
      return data.tree
        .filter((item: any) => item.type === "blob")
        .map((item: any) => item.path)
        .join('\n');
    } catch (error) {
      console.error("Error fetching repository structure:", error);
      throw error;
    }
  };
  
  const generateAnalysis = async (owner: string, repo: string, structure: string): Promise<string> => {
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
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis failed: ${response.statusText}. ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  };
  
  const generateInstructions = async (owner: string, repo: string): Promise<string> => {
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
      const errorText = await response.text();
      throw new Error(`Guidelines generation failed: ${response.statusText}. ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  };
  
  const handleCopy = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      toast({
        title: "Copied!",
        description: "Analysis copied to clipboard"
      });
    }
  };
  
  const handleExport = () => {
    if (analysis) {
      const blob = new Blob([analysis], {
        type: "text/plain"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "github-analysis.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Exported!",
        description: "Analysis exported successfully"
      });
    }
  };
  
  // Reset the error state when trying again
  const handleResetError = () => {
    setApiError(null);
  };
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-foreground">
          GitHub Repository Analyzer
        </h1>
        
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
                  {!isKeySet ? <Button type="submit" className="bg-mint hover:bg-mint-light text-white">
                      Save Key
                    </Button> : <Button type="button" onClick={handleRemoveKey} variant="outline" className="hover:text-destructive">
                      Remove Key
                    </Button>}
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
                            {OPENROUTER_MODELS.map(model => <SelectItem key={model.value} value={model.value}>
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
                
                <form onSubmit={handleAnalyze} className="flex space-x-2">
                  <Input placeholder="Enter GitHub repository URL" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} className="flex-1" />
                  <Button type="submit" className="bg-mint hover:bg-mint-light text-white" disabled={!isKeySet || isLoading}>
                    {isLoading ? "Analyzing..." : "Analyze"}
                  </Button>
                </form>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Analysis Results</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={handleCopy} className="hover:text-mint" disabled={!analysis}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleExport} className="hover:text-mint" disabled={!analysis}>
                    <Download className="w-4 h-4" />
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
                    ) : isLoading ? (
                      <p className="text-muted-foreground">Analyzing repository...</p>
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
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FolderTree className="w-5 h-5 text-mint" />
                <h2 className="text-xl font-semibold">File Structure</h2>
              </div>
              <div className="relative h-[400px] bg-muted rounded-lg">
                <ErrorBoundary>
                  <div className="absolute inset-0 p-4 overflow-y-auto">
                    {isLoading ? (
                      <p className="text-muted-foreground">Loading repository structure...</p>
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
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-mint" />
                  <h2 className="text-xl font-semibold">Generated Custom Instructions</h2>
                </div>
                <Button variant="outline" size="icon" onClick={() => {
                if (customInstructions) {
                  navigator.clipboard.writeText(customInstructions);
                  toast({
                    title: "Copied!",
                    description: "Custom instructions copied to clipboard"
                  });
                }
              }} className="hover:text-mint" disabled={!customInstructions}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative h-[400px] bg-muted rounded-lg">
                <ErrorBoundary>
                  <div className="absolute inset-0 p-4 overflow-y-auto">
                    {isLoading ? (
                      <p className="text-muted-foreground">Generating custom instructions...</p>
                    ) : customInstructions ? (
                      <pre className="whitespace-pre-wrap text-sm">{customInstructions}</pre>
                    ) : (
                      <p className="text-muted-foreground">
                        AI-generated custom instructions will appear here...
                      </p>
                    )}
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
