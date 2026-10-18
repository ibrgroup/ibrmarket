"use client";
import React, { useState, useEffect } from "react";
import { FaArrowUpLong } from "react-icons/fa6";

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
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
    <React.Fragment>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[1000] bg-tiffany h-14 w-14 flex items-center justify-center text-white rounded-full shadow-lg transition-transform transform hover:scale-110"
          aria-label="Вверх"
        >
         <FaArrowUpLong/>
        </button>
      )}
    </React.Fragment>
  );
};

export default ScrollToTop;
