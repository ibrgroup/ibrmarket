import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Slide {
  id: number;
  src: string;
  alt: string;
  caption: string;
}

// Обратите внимание: изображения должны лежать в /public
// Примеры: /public/monin.jpeg, /public/samsung.png
const slides: Slide[] = [
  {
    id: 1,
    src: 'https://static-basket-01.wbbasket.ru/vol1/crm-bnrs/bnnrsdmn/image/2880x600/61cc6b95-7a83-4422-b769-c3f92fa8fa30.webp', // файл public/monin.jpeg
    alt: 'Слайд 1',
    caption: 'Реклама',
  },

    {
    id: 2,
    src: 'https://static-basket-01.wbbasket.ru/vol1/crm-bnrs/bnnrsdmn/image/2880x600/a71e4a49-2be2-45d5-ae88-01247d16ab7e.webp', // файл public/samsung.png
    alt: 'Слайд 2',
    caption: 'Реклама',
  },
    {
    id: 3,
    src: 'https://static-basket-01.wbbasket.ru/vol1/crm-bnrs/bnnrsdmn/image/2880x600/93f88dc4-8beb-4400-85f3-3eca33fbfab5.webp',
    alt: 'Слайд 3',
    caption: 'Реклама',
  },
  {
    id: 4,
    src: '/samsung.png', // файл public/samsung.png
    alt: 'Слайд 4',
    caption: 'Реклама',
  },
];

const MobileSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Проверка мобильности
  const isMobile = useRef<boolean>(false);
  useEffect(() => {
    const handleResize = () => {
      isMobile.current = window.innerWidth <= 768;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Свайп обработчики
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.changedTouches[0].clientX;
    setIsPaused(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (
      touchStartXRef.current !== null &&
      touchEndXRef.current !== null
    ) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (diff > 50) nextSlide();
      else if (diff < -50) prevSlide();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setIsPaused(false);
  };

  // Автосдвиг при смене currentIndex
  useEffect(() => {
    if (containerRef.current && isMobile.current) {
      const container = containerRef.current;
      const slideWidth = container.offsetWidth;
      container.scrollTo({
        left: slideWidth * currentIndex,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  return (
    <div className="mt-2 max-w-full relative">
      <div
        ref={containerRef}
        className="flex items-center overflow-x-auto scrollbar-hide"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: isMobile.current ? 'x mandatory' : 'none',
          padding: '0 6px',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="flex-shrink-0 mx-1"
            style={{
              scrollSnapAlign: 'center',
              width: '90%',
            }}
          >
            <div className="relative rounded-xl overflow-hidden aspect-[18/9] w-full transition-transform duration-300 ease-in-out">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
              <p className="bg-[#f2f2f2b9] absolute right-2 bottom-1.5 text-black text-xs p-0.5 px-1 rounded-md">
                {slide.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .scrollbar-hide {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE и Edge */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
    </div>
  );
};

export default MobileSlider;