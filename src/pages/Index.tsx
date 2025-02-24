
import { GithubAnalyzer } from "@/components/GithubAnalyzer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ResponsiveBoxGrid } from "@/components/ResponsiveBoxGrid";

const Index = () => {
  const boxes = [
    {
      title: "Code Analysis",
      description: "Analyze your GitHub repository structure and patterns",
      image: {
        src: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
        alt: "Code analysis illustration"
      }
    },
    {
      title: "Technical Insights",
      description: "Get detailed insights about your codebase architecture",
      image: {
        src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
        alt: "Technical insights illustration"
      }
    },
    {
      title: "Development Guidelines",
      description: "Generate custom development guidelines for your project",
      image: {
        src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
        alt: "Development guidelines illustration"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container py-8">
        <div className="relative">
          {/* Subtle gradient orb in the background */}
          <div className="absolute inset-0 bg-mint/5 -z-10 blur-3xl rounded-[50%] h-32"></div>
          <div className="animate-fade-in">
            <GithubAnalyzer />
          </div>
        </div>
      </div>
      <ResponsiveBoxGrid boxes={boxes} />
      <ScrollToTop />
    </div>
  );
};

export default Index;
