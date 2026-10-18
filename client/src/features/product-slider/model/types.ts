/**
 * Типы для Product Slider
 */

// Базовый тип слайда
export interface Slide {
  id: number;
  image: string;
  title: string;
  priceCurrent: string;
  priceOld?: string;
  discount?: string;
}

// Состояние видимости слайда
export interface SlideState {
  isCenter: boolean;
  isVisible: boolean;
  isAdjacent: boolean;
}

// Стили слайда
export interface SlideStyle {
  transform: string;
  opacity: number;
  zIndex: number;
  filter: string;
}

// Конфигурация breakpoints
export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

// Конфигурация transitions
export interface TransitionConfig {
  default: string;
  smooth: string;
  fast: string;
}

// Конфигурация autoplay
export interface AutoplayConfig {
  enabled: boolean;
  interval: number;
  pauseOnHover: boolean;
  pauseOnFocus: boolean;
}

// Конфигурация стилей слайдов
export interface SlideStyleConfig {
  center: Omit<SlideStyle, "transform" | "filter"> & {
    scale: number;
  };
  visible: Omit<SlideStyle, "transform" | "filter"> & {
    scale: number;
  };
  hidden: Omit<SlideStyle, "transform" | "filter"> & {
    scale: number;
  };
}

// Общая конфигурация карусели
export interface CarouselConfig {
  breakpoints: BreakpointConfig;
  transitions: TransitionConfig;
  autoplay: AutoplayConfig;
  slideStyles: SlideStyleConfig;
  accessibility: {
    announceSlideChange: boolean;
    announceAutoplay: boolean;
  };
}

// Навигационные действия
export type NavigationAction = "prev" | "next" | "goto";

// Результат расчета breakpoint
export interface BreakpointResult {
  slidesToShow: number;
  currentBreakpoint: keyof BreakpointConfig;
}

// Ошибки карусели
export type CarouselError = "INVALID_SLIDES" | "EMBLA_NOT_READY" | "NAVIGATION_ERROR";

export interface CarouselErrorInfo {
  type: CarouselError;
  message: string;
  recoverable: boolean;
}
