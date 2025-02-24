
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle } from "lucide-react";

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 500) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-5 right-5 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUpCircle className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};
