import { useState, useEffect } from "react";
import { Github, FolderTree, Copy, Download, Key, MessageSquare, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OPENROUTER_MODELS = [
  { value: "openai/gpt-4o-2024-08-06", label: "GPT-4 Turbo (Aug 2024)" },
  { value: "openai/gpt-4o-2024-05-13", label: "GPT-4 Turbo (May 2024)" },
  { value: "openai/gpt-4o-mini-2024-07-18", label: "GPT-4 Turbo Mini" },
  { value: "openai/chatgpt-4o-latest", label: "ChatGPT-4 Latest" },
  { value: "openai/o1-preview-2024-09-12", label: "O1 Preview" },
  { value: "openai/o1-mini-2024-09-12", label: "O1 Mini" },
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku" },
  { value: "anthropic/claude-3-opus", label: "Claude 3 Opus" },
  { value: "anthropic/claude-2.1", label: "Claude 2.1" },
  { value: "google/gemini-pro-1.5", label: "Gemini Pro 1.5" },
  { value: "google/gemini-flash-1.5", label: "Gemini Flash 1.5" },
  { value: "mistralai/mistral-large-2407", label: "Mistral Large" },
  { value: "mistralai/mistral-nemo", label: "Mistral Nemo" },
  { value: "deepseek/deepseek-r1", label: "Deepseek R1" },
  { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
  { value: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B" },
  { value: "mistralai/mixtral-8x22b-instruct", label: "Mixtral 8x22B" },
  { value: "cohere/command-r-plus", label: "Command-R Plus" },
  { value: "cohere/command-r", label: "Command-R" },
];

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
  const [aiRole, setAiRole] = useState<string>("You are an expert software architect and code reviewer who specializes in analyzing GitHub repositories.");
  const [provider, setProvider] = useState<"openai" | "openrouter">("openrouter");
  const { toast } = useToast();

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
          repo: pathParts[1],
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
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(`${provider}_key`, apiKey);
    setIsKeySet(true);
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
  };

  const handleRemoveKey = () => {
    localStorage.removeItem(`${provider}_key`);
    setApiKey("");
    setIsKeySet(false);
    toast({
      title: "Removed",
      description: "API key removed successfully",
    });
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKeySet) {
      toast({
        title: "Error",
        description: `Please set your ${provider === "openai" ? "OpenAI" : "OpenRouter"} API key first`,
        variant: "destructive",
      });
      return;
    }

    if (!repoUrl) {
      toast({
        title: "Error",
        description: "Please enter a GitHub repository URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setFileStructure("");
    setAnalysis("");
    setCustomInstructions("");
    
    try {
      const { owner, repo } = extractRepoInfo(repoUrl);

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (!response.ok) {
        throw new Error("Failed to fetch repository data");
      }
      const data = await response.json();

      const structure = data.map((item: any) => `${item.type}: ${item.path}`).join('\n');
      setFileStructure(structure);

      const endpoint = provider === "openai" 
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(provider === "openrouter" && { 'HTTP-Referer': window.location.origin }),
      };

      const modelConfig = provider === "openai" 
        ? { model: "o3-mini" }
        : { model: useModelOverride ? selectedModel : 'openrouter/auto' };

      const analysisResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...modelConfig,
          messages: [
            {
              role: 'system',
              content: aiRole,
            },
            {
              role: 'user',
              content: `Analyze this GitHub repository structure and provide insights about the project architecture:

Repository: ${owner}/${repo}

File Structure:
${structure}

Please provide a detailed analysis including:
1. Project architecture overview
2. Main components and their potential purposes
3. Suggested improvements or best practices
4. Technologies identified from the file structure`,
            },
          ],
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        throw new Error(`Failed to analyze repository: ${errorData.error?.message || analysisResponse.statusText}`);
      }

      const analysisData = await analysisResponse.json();
      const analysisText = analysisData.choices[0].message.content;
      setAnalysis(analysisText);

      const instructionsResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...modelConfig,
          messages: [
            {
              role: 'system',
              content: "You are an expert software architect specializing in creating comprehensive development guidelines.",
            },
            {
              role: 'user',
              content: `Based on this repository analysis, create detailed custom AI instructions:

${analysisText}

Create instructions addressing:
1. Core Understanding & Business Context
2. Technical Architecture Guidelines
3. Development Standards
4. Future Considerations
5. Change Management Guidelines`,
            },
          ],
        }),
      });

      if (!instructionsResponse.ok) {
        const errorData = await instructionsResponse.json().catch(() => ({}));
        throw new Error(`Failed to generate custom instructions: ${errorData.error?.message || instructionsResponse.statusText}`);
      }

      const instructionsData = await instructionsResponse.json();
      const instructions = instructionsData.choices[0].message.content;
      setCustomInstructions(instructions);
      
      toast({
        title: "Analysis Complete",
        description: "Repository has been successfully analyzed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze repository",
        variant: "destructive",
      });
      setAnalysis("");
      setFileStructure("");
      setCustomInstructions("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      toast({
        title: "Copied!",
        description: "Analysis copied to clipboard",
      });
    }
  };

  const handleExport = () => {
    if (analysis) {
      const blob = new Blob([analysis], { type: "text/plain" });
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
        description: "Analysis exported successfully",
      });
    }
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

                <Select
                  value={provider}
                  onValueChange={(value: "openai" | "openrouter") => setProvider(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select API Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
                
                <form onSubmit={handleSaveKey} className="flex space-x-2">
                  <Input
                    type="password"
                    placeholder={`Enter ${provider === "openai" ? "OpenAI" : "OpenRouter"} API key`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  {!isKeySet ? (
                    <Button 
                      type="submit"
                      className="bg-mint hover:bg-mint-light text-white"
                    >
                      Save Key
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      onClick={handleRemoveKey}
                      variant="outline"
                      className="hover:text-destructive"
                    >
                      Remove Key
                    </Button>
                  )}
                </form>

                {provider === "openrouter" && (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="model-override"
                          checked={useModelOverride}
                          onCheckedChange={setUseModelOverride}
                        />
                        <Label htmlFor="model-override">Use Model Override</Label>
                      </div>
                      
                      {useModelOverride && (
                        <Select
                          value={selectedModel}
                          onValueChange={setSelectedModel}
                        >
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPENROUTER_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    {useModelOverride && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Different models have varying capabilities, response times, and costs. If analysis seems slow, the selected model might have longer processing times. Faster models may provide less detailed analysis.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-mint" />
                  <h2 className="text-xl font-semibold">AI Role Configuration</h2>
                </div>
                <Textarea
                  placeholder="Enter the role/persona for the AI analyzer"
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Github className="w-5 h-5 text-mint" />
                  <h2 className="text-xl font-semibold">Repository Input</h2>
                </div>
                
                <form onSubmit={handleAnalyze} className="flex space-x-2">
                  <Input
                    placeholder="Enter GitHub repository URL"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="flex-1"
                  />
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Analysis Results</h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="hover:text-mint"
                    disabled={!analysis}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExport}
                    className="hover:text-mint"
                    disabled={!analysis}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="relative h-[400px] bg-muted rounded-lg">
                <div className="absolute inset-0 p-4 overflow-y-auto">
                  {isLoading ? (
                    <p className="text-muted-foreground">Analyzing repository...</p>
                  ) : analysis ? (
                    <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
                  ) : (
                    <p className="text-muted-foreground">
                      Analysis results will appear here...
                    </p>
                  )}
                </div>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (customInstructions) {
                      navigator.clipboard.writeText(customInstructions);
                      toast({
                        title: "Copied!",
                        description: "Custom instructions copied to clipboard",
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
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
