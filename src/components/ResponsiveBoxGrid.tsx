
import { ResponsiveBox } from "./ResponsiveBox";

const boxes = [
  {
    title: "Code Analysis",
    description: "Analyze your GitHub repository structure and patterns",
    image: {
      src: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
      alt: "Code analysis illustration",
    },
  },
  {
    title: "Technical Insights",
    description: "Get detailed insights about your codebase architecture",
    image: {
      src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
      alt: "Technical insights illustration",
    },
  },
  {
    title: "Development Guidelines",
    description: "Generate custom development guidelines for your project",
    image: {
      src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      alt: "Development guidelines illustration",
    },
  },
];

export const ResponsiveBoxGrid = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boxes.map((box, index) => (
          <ResponsiveBox
            key={index}
            title={box.title}
            description={box.description}
            image={box.image}
          />
        ))}
      </div>
    </div>
  );
};
