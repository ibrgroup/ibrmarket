/**
 * Типы для Location Store
 */

export interface LocationState {
  city: string;
  deliveryDate: string | null;
  isAutoDetected: boolean;
}

export interface LocationStore extends LocationState {
  setCity: (city: string) => void;
  setDeliveryDate: (date: string | null) => void;
  detectLocation: () => Promise<void>;
  reset: () => void;
}
