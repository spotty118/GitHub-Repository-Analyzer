
import { GithubAnalyzer } from "@/components/GithubAnalyzer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container py-8 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-mint/5 -z-10 blur-3xl rounded-[50%] h-32"></div>
          <GithubAnalyzer />
        </div>
      </div>
    </div>
  );
};

export default Index;
