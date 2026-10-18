import React, { memo } from "react";

interface CarouselIndicatorsProps {
  totalSlides: number;
  currentIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Компонент индикаторов (точек) для навигации
 * Мемоизирован для оптимизации производительности
 */
const CarouselIndicators: React.FC<CarouselIndicatorsProps> = memo(
  ({ totalSlides, currentIndex, onSelect }) => {
    // Не показываем индикаторы если слайд один
    if (totalSlides <= 1) {
      return null;
    }

    return (
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1"
        role="tablist"
        aria-label="Навигация по слайдам"
      >
        {Array.from({ length: totalSlides }, (_, index) => (
          <button
            key={index}
            role="tab"
            aria-label={`Перейти к слайду ${index + 1}`}
            aria-selected={index === currentIndex}
            aria-controls={`slide-${index}`}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-2 focus:outline-offset-2 focus:outline-white ${
              index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
            onClick={() => onSelect(index)}
            onKeyDown={(e) => {
              // Accessibility: поддержка клавиатурной навигации по индикаторам
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(index);
              }
            }}
          />
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Оптимизация: ре-рендерим только если изменился текущий индекс или количество слайдов
    return (
      prevProps.totalSlides === nextProps.totalSlides &&
      prevProps.currentIndex === nextProps.currentIndex
    );
  },
);

CarouselIndicators.displayName = "CarouselIndicators";

export default CarouselIndicators;
