
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsiveBoxProps {
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
  };
}

export const ResponsiveBox = ({ title, description, image }: ResponsiveBoxProps) => {
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg">
      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
        <img
          src={image.src}
          alt={image.alt}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
        <CardDescription className="text-sm md:text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
};
