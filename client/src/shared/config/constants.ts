// Глобальные константы приложения

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.example.com",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// UI Constants
export const UI_CONFIG = {
  BREAKPOINTS: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
  CONTAINER_MAX_WIDTH: "1440px",
  SIDEBAR_WIDTH: "280px",
  HEADER_HEIGHT: "80px",
} as const;

// Animation durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Local Storage keys
export const STORAGE_KEYS = {
  TOKEN: "accessToken",
  USER: "user_data",
  CART: "cart_items",
  THEME: "app_theme",
  LANGUAGE: "app_language",
} as const;

// Validation rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-()]+$/,
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_PWA: process.env.NEXT_PUBLIC_ENABLE_PWA === "true",
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === "true",
} as const;
