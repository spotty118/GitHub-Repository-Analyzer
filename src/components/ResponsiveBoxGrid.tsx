
import { ResponsiveBox } from "./ResponsiveBox";

interface BoxData {
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
}

interface ResponsiveBoxGridProps {
  boxes: BoxData[];
}

export const ResponsiveBoxGrid = ({ boxes }: ResponsiveBoxGridProps) => {
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
