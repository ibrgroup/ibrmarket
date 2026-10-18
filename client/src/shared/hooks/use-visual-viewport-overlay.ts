import { useEffect } from 'react';

const OVERLAY_STYLE_KEYS = ['top', 'left', 'width', 'height', 'right', 'bottom'] as const;

function resetOverlayStyles(el: HTMLElement) {
  for (const key of OVERLAY_STYLE_KEYS) {
    el.style[key] = '';
  }
}

/**
 * Держит backdrop модалки в границах visual viewport (клавиатура на iOS/Android).
 */
export function useVisualViewportOverlay(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    const vv = window.visualViewport;
    if (!vv) return;

    let overlay: HTMLElement | null = null;

    const sync = () => {
      overlay = ref.current;
      if (!overlay) return;

      overlay.style.top = `${vv.offsetTop}px`;
      overlay.style.left = `${vv.offsetLeft}px`;
      overlay.style.width = `${vv.width}px`;
      overlay.style.height = `${vv.height}px`;
      overlay.style.right = 'auto';
      overlay.style.bottom = 'auto';
    };

    const frame = requestAnimationFrame(sync);

    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);

    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      if (overlay) resetOverlayStyles(overlay);
    };
  }, [enabled, ref]);
}
