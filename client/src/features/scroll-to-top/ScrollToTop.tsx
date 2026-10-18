'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaArrowUpLong } from "react-icons/fa6";

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Обработчик скролла
  const toggleVisibility = useCallback(() => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  // Обработчик клика по стрелке
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [toggleVisibility]);

  return (
    <>
      {isVisible && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-18 w-12 h-12 md:bottom-8 right-6 z-20 bg-tiffany flex items-center justify-center bg-primary text-white rounded-full shadow-lg transition-transform transform hover:scale-110"
          aria-label="Вверх"
        >
          <FaArrowUpLong size={22} />
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
