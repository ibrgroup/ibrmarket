declare global {
  namespace JSX {
    interface IntrinsicElements {
      'swiper-container': {
        [key: string]: any;
      };
      'swiper-slide': {
        [key: string]: any;
      };
    }
  }
}