
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slide {
  id: number;
  imageUrl: string;
  title: string;
  description: string;
  link?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81",
    title: "Bem-vindo à Intranet Super Nosso",
    description: "Seu portal de comunicação e colaboração",
    link: "#"
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    title: "Compartilhe Conhecimento",
    description: "Conecte-se com a equipe e compartilhe informações importantes",
    link: "/timeline"
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    title: "Organize seus Arquivos",
    description: "Acesse e gerencie documentos de forma simples",
    link: "/arquivos"
  }
];

export function CarouselBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full h-[300px] sm:h-[400px] overflow-hidden rounded-xl shadow-md">
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={cn(
            "absolute inset-0 w-full h-full transition-all duration-500 ease-in-out",
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <div className="relative w-full h-full">
            <div className={cn(
              "absolute inset-0 bg-black/40 z-10 transition-opacity",
              isLoading ? "opacity-100" : "opacity-40"
            )} />
            <img 
              src={slide.imageUrl} 
              alt={slide.title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-700",
                index === currentSlide ? "scale-105" : "scale-100"
              )}
              onLoad={() => setIsLoading(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-2 animate-fade-in">{slide.title}</h3>
              <p className="text-sm sm:text-base mb-4 max-w-md animate-fade-in opacity-90">{slide.description}</p>
              {slide.link && (
                <Button 
                  variant="outline" 
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 hover:border-white/30 animate-fade-in"
                  onClick={() => window.location.href = slide.link || "#"}
                >
                  Saiba mais
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white rounded-full"
        onClick={prevSlide}
      >
        <ChevronLeft size={20} />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white rounded-full"
        onClick={nextSlide}
      >
        <ChevronRight size={20} />
      </Button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentSlide 
                ? "bg-white w-6" 
                : "bg-white/50 hover:bg-white/70"
            )}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
