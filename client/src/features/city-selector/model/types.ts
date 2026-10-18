/**
 * Типы для City Selector feature
 */

export interface CitySelectorProps {
  className?: string;
}

export interface City {
  id: string;
  name: string;
  region?: string;
}
