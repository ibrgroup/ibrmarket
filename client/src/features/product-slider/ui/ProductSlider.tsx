
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaChevronLeft } from "react-icons/fa";
import { FaChevronRight } from "react-icons/fa";

interface Slide {
  id: number;
  src: string;
  alt: string;
  caption: string;
}

const slides: Slide[] = [
  {
    id: 1,
    src: 'https://static-basket-01.wbbasket.ru/vol1/crm-bnrs/bnnrsdmn/image/2880x600/61cc6b95-7a83-4422-b769-c3f92fa8fa30.webp',
    alt: 'Слайд 1',
    caption: 'Реклама',
  },
  {
    id: 2,
    src: 'https://static-basket-01.wbbasket.ru/vol1/crm-bnrs/bnnrsdmn/image/2880x600/a71e4a49-2be2-45d5-ae88-01247d16ab7e.webp',
    alt: 'Слайд 2',
    caption: 'Реклама',
  },
  {
    id: 3,
    src: 'https://static-basket-01.wbbasket.ru/vol1/crm-bnrs/bnnrsdmn/image/2880x600/fd27f0ce-df8a-45d3-b9b7-5cae6fb4984d.webp',
    alt: 'Слайд 3',
    caption: 'Реклама',
  },
  {
    id: 4,
    src: 'https://static-basket-01.wbbasket.ru/vol1/crm-bnrs/bnnrsdmn/image/2880x600/93f88dc4-8beb-4400-85f3-3eca33fbfab5.webp',
    alt: 'Слайд 4',
    caption: 'Реклама',
  },

  {
    id: 5,
    src: '/samsung.png',
    alt: 'Слайд 5',
    caption: 'Реклама',
  },
];

const SWIPE_THRESHOLD = 50;

const ProductSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Для touch-свайпов
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Для drag мышью
  const mouseDownXRef = useRef<number | null>(null);
  const mouseMoveXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Touch события
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
      if (diff > SWIPE_THRESHOLD) nextSlide();
      else if (diff < -SWIPE_THRESHOLD) prevSlide();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setIsPaused(false);
  };

  // Mouse drag события
  const onMouseDown = (e: React.MouseEvent) => {
    mouseDownXRef.current = e.clientX;
    isDraggingRef.current = true;
    setIsPaused(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    mouseMoveXRef.current = e.clientX;
  };

  const onMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (
      mouseDownXRef.current !== null &&
      mouseMoveXRef.current !== null
    ) {
      const diff = mouseDownXRef.current - mouseMoveXRef.current;
      if (diff > SWIPE_THRESHOLD) nextSlide();
      else if (diff < -SWIPE_THRESHOLD) prevSlide();
    }

    mouseDownXRef.current = null;
    mouseMoveXRef.current = null;
    setIsPaused(false);
  };


  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  };

  return (
    <div className="mt-2 md:mt-5 px-4 max-container m-auto">

      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className="relative mx-auto rounded-2xl md:rounded-3xl h-38 md:h-72 overflow-hidden aspect-[375/200] sm:aspect-[375/200] xs:aspect-[375/200] w-full outline-none select-none cursor-grab" aria-roledescription="carousel" aria-label="Product image slider"
      >
        <div className="relative h-full w-full">
          {slides.map((slide, index) => {
            const offset = index - currentIndex;
            return (
              <div
                key={slide.id}
                className="absolute top-0 left-0 w-full h-full flex items-center justify-center transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(${offset * 100}%)` }}
                aria-hidden={index !== currentIndex}
                aria-roledescription="slide"
                aria-label={`${index + 1} из ${slides.length}`}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  layout="fill"
                  objectFit="cover"
                  className="slide-image select-none cursor-pointer"
                  priority={index === currentIndex}
                  quality={80}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none select-none absolute opacity-50 bottom-4 right-[-1rem] transform -translate-x-1/2 
                      bg-white bg-opacity-80 text-gray-800 text-[10px] px-2 py-0.5 rounded-md drop-shadow-lg font-semibold">
          Реклама :
        </div>

        <button
          aria-label="Следующий слайд"
          onClick={prevSlide}
          className="absolute top-1/2 justify-center md:block hidden left-3 sm:left-2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg flex items-center hover:opacity-70 cursor-pointer  bg-gray-100 opacity-50 bg-opacity-50 text-2xl"
        >
          <FaChevronLeft className='absolute left-2 bottom-2' size={14} />
        </button>
        <button
          aria-label="Предыдущий слайд"
          onClick={nextSlide}
          className="absolute top-1/2 md:block hidden right-3 sm:right-2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg flex items-center hover:opacity-70 cursor-pointer justify-center bg-gray-100 opacity-50 bg-opacity-50 hover:bg-opacity-75 text-2xl"
        >
          <FaChevronRight className='absolute left-2.5 bottom-2' size={14} />
        </button>
      </div>


    </div>
  );
};

export default ProductSlider;


