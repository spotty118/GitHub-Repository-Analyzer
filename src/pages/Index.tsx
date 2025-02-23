
import { GithubAnalyzer } from "@/components/GithubAnalyzer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container py-12">
        <div className="relative">
          {/* More visible gradient orb in the background */}
          <div className="absolute inset-0 bg-mint/10 -z-10 blur-3xl rounded-[50%] h-48"></div>
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-semibold mb-8 text-gradient-primary">GitHub Repository Analyzer</h1>
            <GithubAnalyzer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
