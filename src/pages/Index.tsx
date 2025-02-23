
const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container py-8 px-4 md:px-8">
        <div className="relative">
          <div className="absolute inset-0 bg-mint/5 blur-3xl rounded-full transform -translate-y-1/2"></div>
          <GithubAnalyzer />
        </div>
      </div>
    </div>
  );
};

export default Index;
