import React, { memo } from "react";
import { CarouselPrevious, CarouselNext } from "@/shared/ui/carousel";

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  isVisible: boolean;
  totalSlides: number;
}

/**
 * Компонент контролов навигации (кнопки Prev/Next)
 * Показывается только при hover и если слайдов больше одного
 */
const CarouselControls: React.FC<CarouselControlsProps> = memo(
  ({ onPrev, onNext, isVisible, totalSlides }) => {
    // Не показываем кнопки если слайд один
    if (totalSlides <= 1) {
      return null;
    }

    return (
      <>
        {/* Previous Button */}
        <div
          className={`absolute inset-y-0 left-0 flex items-center transition-all duration-300 ${
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <CarouselPrevious
            className="left-2 bg-white/90 hover:bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 w-10 h-10 rounded-full"
            onClick={onPrev}
            aria-label="Предыдущий слайд"
          />
        </div>

        {/* Next Button */}
        <div
          className={`absolute inset-y-0 right-0 flex items-center transition-all duration-300 ${
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <CarouselNext
            className="right-2 bg-white/90 hover:bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 w-10 h-10 rounded-full"
            onClick={onNext}
            aria-label="Следующий слайд"
          />
        </div>
      </>
    );
  },
);

CarouselControls.displayName = "CarouselControls";

export default CarouselControls;
