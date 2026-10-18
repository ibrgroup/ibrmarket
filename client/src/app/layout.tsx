{/* deploy fix */}
import { getThemeAntiFlashHeadCss } from '@/shared/colors/theme-anti-fouc';
import {
  COLOR_SCHEME_COOKIE_NAME,
  parseColorScheme,
  parseStoredThemePreference,
  resolveActualTheme,
  THEME_COOKIE_NAME,
} from '@/shared/colors/theme-cookies';
import { THEME_BEFORE_INTERACTIVE_SCRIPT } from '@/shared/colors/theme-inline-script';
import {
  getBaseUrl,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_SHORT,
  SITE_NAME,
} from '@/shared/config/site';
import {
  QueryProvider,
  StoreSyncProvider,
  ThemeProvider,
  UserStoreRehydrate,
} from '@/shared/providers';
import { OrganizationWebSiteJsonLd } from '@/shared/ui/seo/OrganizationWebSiteJsonLd';
import { SiteChrome } from '@/widgets/site-chrome';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { cookies } from 'next/headers';
import Script from 'next/script';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
});

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${SITE_NAME} — Интернет-магазин, каталог товаров`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'интернет-магазин',
    'маркетплейс',
    'покупки онлайн',
    'каталог товаров',
    'доставка',
    'IBR Market',
  ],
  authors: [{ name: SITE_NAME, url: baseUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: baseUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Интернет-магазин`,
    description: SITE_DESCRIPTION_SHORT,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Интернет-магазин`,
    description: SITE_DESCRIPTION_SHORT,
  },
  alternates: {
    canonical: baseUrl,
  },
  category: 'ecommerce',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME);
  const schemeCookie = cookieStore.get(COLOR_SCHEME_COOKIE_NAME);

  const storedTheme = parseStoredThemePreference(themeCookie?.value, 'light');
  const storedScheme = parseColorScheme(schemeCookie?.value);
  const themePreferenceFromCookie = themeCookie !== undefined;
  const colorSchemePreferenceFromCookie = schemeCookie !== undefined;

  const htmlResolved = resolveActualTheme(storedTheme, false);

  return (
    <html
      lang="ru"
      className={htmlResolved}
      data-theme={htmlResolved}
      data-color-scheme={storedScheme}
      suppressHydrationWarning
    >
      <head>
        {/* Критический CSS до globals (внешние @import шрифтов в globals задерживают парсинг ниже) */}
        <style
          id="ibr-theme-flash-guard"
          dangerouslySetInnerHTML={{ __html: getThemeAntiFlashHeadCss(htmlResolved) }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        <link rel="manifest" href="/manifest.json" />
        <title>IBR Market</title>
      </head>
      <body
        className={`${nunito.variable} flex min-h-screen flex-col antialiased`}
        suppressHydrationWarning
      >
        <Script id="ibr-theme-init" strategy="beforeInteractive">
          {THEME_BEFORE_INTERACTIVE_SCRIPT}
        </Script>
        <OrganizationWebSiteJsonLd />
        <QueryProvider>
          <ThemeProvider
            defaultTheme="light"
            storageKey="ibr-market-theme"
            initialTheme={storedTheme}
            initialColorScheme={storedScheme}
            themePreferenceFromCookie={themePreferenceFromCookie}
            colorSchemePreferenceFromCookie={colorSchemePreferenceFromCookie}
          >
            <UserStoreRehydrate />
            <StoreSyncProvider>
              <SiteChrome>{children}</SiteChrome>
            </StoreSyncProvider>
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
        
      </body>
    </html>
  );
}
