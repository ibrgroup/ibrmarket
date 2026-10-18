export type HeaderMode = 'full' | 'search-only' | 'hidden';

export interface SiteChromeConfig {
  topBar: boolean;
  header: HeaderMode;
  bottomNav: boolean;
  footer: boolean;
  quickView: boolean;
}

/**
 * Мобильная шапка по умолчанию скрыта — на большинстве экранов свой заголовок
 * или достаточно нижней навигации. На десктопе (md+) TopBar и Header всегда полные.
 */
const DEFAULT_CHROME: SiteChromeConfig = {
  topBar: false,
  header: 'hidden',
  bottomNav: true,
  footer: false,
  quickView: true,
};

type ChromeRule = {
  match: (pathname: string) => boolean;
  config: Partial<SiteChromeConfig>;
};

const CHROME_RULES: ChromeRule[] = [
  {
    match: (pathname) => pathname.startsWith('/dashboard'),
    config: {
      topBar: false,
      header: 'hidden',
      bottomNav: false,
      footer: false,
      quickView: false,
    },
  },
  {
    match: (pathname) => pathname === '/login',
    config: {
      topBar: false,
      header: 'hidden',
      footer: false,
    },
  },
  {
    match: (pathname) => pathname.startsWith('/checkout'),
    config: {
      topBar: false,
      header: 'hidden',
      bottomNav: false,
      footer: false,
    },
  },
  {
    match: (pathname) => pathname === '/',
    config: {
      topBar: true,
      header: 'full',
      footer: true,
    },
  },
  {
    match: (pathname) => pathname.startsWith('/search'),
    config: {
      topBar: false,
      header: 'search-only',
      footer: false,
    },
  },
  {
    match: (pathname) =>
      pathname.startsWith('/products') ||
      pathname.startsWith('/product/') ||
      pathname === '/catalog',
    config: {
      topBar: false,
      header: 'hidden',
      footer: false,
    },
  },
  {
    match: (pathname) =>
      pathname === '/cart' ||
      pathname === '/wishlist' ||
      pathname.startsWith('/my-account') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/my-orders') ||
      pathname === '/purchases' ||
      pathname === '/messages' ||
      pathname === '/payment',
    config: {
      topBar: false,
      header: 'hidden',
      footer: false,
    },
  },
  {
    match: (pathname) =>
      pathname.startsWith('/help') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/delivery') ||
      pathname.startsWith('/contacts') ||
      pathname.startsWith('/refund') ||
      pathname.startsWith('/privacy'),
    config: {
      topBar: false,
      header: 'hidden',
      footer: true,
    },
  },
];

export function resolveSiteChromeConfig(pathname: string): SiteChromeConfig {
  const rule = CHROME_RULES.find(({ match }) => match(pathname));
  return rule ? { ...DEFAULT_CHROME, ...rule.config } : DEFAULT_CHROME;
}
