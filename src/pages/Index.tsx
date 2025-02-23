
import { GithubAnalyzer } from "@/components/GithubAnalyzer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container py-8 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-mint/5 -z-10 blur-3xl rounded-[50%] h-32 animate-pulse"></div>
          <div className="relative z-10 rounded-xl bg-white/50 dark:bg-black/20 backdrop-blur-sm p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
            <GithubAnalyzer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
