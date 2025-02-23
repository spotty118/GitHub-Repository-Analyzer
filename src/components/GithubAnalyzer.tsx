
import { useState, useEffect } from "react";
import { Github, FolderTree, Copy, Download, Key } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const GithubAnalyzer = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileStructure, setFileStructure] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
    }
  }, []);

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
        description: "Please enter a valid OpenRouter API key",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("openrouter_key", apiKey);
    setIsKeySet(true);
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
  };

  const handleRemoveKey = () => {
    localStorage.removeItem("openrouter_key");
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
        description: "Please set your OpenRouter API key first",
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
    
    try {
      // Extract owner and repo from URL
      const { owner, repo } = extractRepoInfo(repoUrl);

      // Fetch repository data from GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (!response.ok) {
        throw new Error("Failed to fetch repository data");
      }
      const data = await response.json();

      // Create a structured representation of the repository
      const structure = data.map((item: any) => `${item.type}: ${item.path}`).join('\n');
      setFileStructure(structure);

      // Prepare prompt for AI analysis
      const prompt = `Analyze this GitHub repository structure and provide insights about the project architecture, main components, and potential improvements:

Repository: ${owner}/${repo}

File Structure:
${structure}

Please provide a detailed analysis including:
1. Project architecture overview
2. Main components and their potential purposes
3. Suggested improvements or best practices
4. Technologies identified from the file structure`;

      // Make OpenRouter API call
      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("Failed to analyze repository");
      }

      const aiData = await aiResponse.json();
      setAnalysis(aiData.choices[0].message.content);
      
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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
          GitHub Repository Analyzer
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="p-6 animate-fade-in">
            <div className="space-y-6">
              {/* API Key Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-mint" />
                  <h2 className="text-xl font-semibold">API Key Configuration</h2>
                </div>
                
                <form onSubmit={handleSaveKey} className="flex space-x-2">
                  <Input
                    type="password"
                    placeholder="Enter OpenRouter API key"
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
              </div>

              {/* Repository Input Section */}
              <div className="space-y-4 pt-4 border-t">
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
                
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FolderTree className="w-5 h-5 text-mint" />
                    <h3 className="text-lg font-medium">File Structure</h3>
                  </div>
                  <div className="bg-muted p-4 rounded-lg min-h-[300px] font-mono text-sm overflow-auto">
                    {isLoading ? (
                      <p className="text-muted-foreground">Loading repository structure...</p>
                    ) : fileStructure ? (
                      <pre className="whitespace-pre">{fileStructure}</pre>
                    ) : (
                      <p className="text-muted-foreground">
                        Repository structure will appear here...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Results Panel */}
          <Card className="p-6 animate-fade-in">
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
              
              <div className="bg-muted p-4 rounded-lg min-h-[400px] font-mono text-sm overflow-auto">
                {isLoading ? (
                  <p className="text-muted-foreground">Analyzing repository...</p>
                ) : analysis ? (
                  <pre className="whitespace-pre-wrap">{analysis}</pre>
                ) : (
                  <p className="text-muted-foreground">
                    Analysis results will appear here...
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
