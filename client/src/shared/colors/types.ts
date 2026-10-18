/**
 * Типы для цветовых схем и тем (централизованные типы для design-tokens и colors)
 */

// Темы приложения
export type Theme = 'light' | 'dark' | 'system';
export type ActualTheme = 'light' | 'dark';

// Цветовые схемы: какие доступны варианты кастомизации цвета бренда
export type ColorScheme =
	| 'violet'
	| 'blue'
	| 'green'
	| 'orange'
	| 'slate'
	| 'yellow'
	| 'pink'
	| 'teal'
	| 'indigo';

// Тип для строкового значения цвета (например, oklch(...) или hex/rgb)
export type ColorValue = string;

// Значения оттенков для цветовых шкал (соответствуют шагам в colors.ts)
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

// Для primary запрещён 950, только до 900
export type PrimaryColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// Семантические цвета (успехи, варнинги и т.д.)
export type SemanticColorType = 'success' | 'warning' | 'error' | 'info';

// Определения коллекций оттенков (для строгих Record-типов)
export type ColorShades = Record<ColorShade, ColorValue>;
export type ColorScales = Record<ColorShade, ColorValue>;
export type PrimaryColorShades = Record<PrimaryColorShade, ColorValue>;

// Модель: цветовая схема бренда для обеих тем
export interface ColorSchemeDefinition {
	primary: {
		light: ColorValue;
		dark: ColorValue;
	};
	foreground: {
		light: ColorValue;
		dark: ColorValue;
	};
}

// Старый формат семантических цветов
export interface SemanticColorDefinition {
	light: ColorValue;
	dark: ColorValue;
}

// Модель семантических цветов, определённых по теме
export type SemanticColors = Record<SemanticColorType, SemanticColorDefinition>;

// Основная структура colorPalette (shared/colors/colors.ts)
// NB: значения строго соответствуют ключам colorPalette из colors.ts!
export interface ColorPalette {
	primary: PrimaryColorShades;
	background: ColorShades;
	foreground: ColorShades;
	border: ColorShades;
	muted: ColorShades;
	gray: ColorScales;
	grayDark: ColorScales;
	// Семантические цвета
	success: Record<50 | 100 | 200 | 300 | 400, ColorValue>;
	warning: Record<50 | 100 | 200 | 300 | 400, ColorValue>;
	danger: Record<50 | 100 | 200 | 300 | 400, ColorValue>;
	info: Record<50 | 100 | 200 | 300 | 400, ColorValue>;
	semantic: SemanticColors;
	schemes: Record<ColorScheme, ColorSchemeDefinition>;
}

// Контекст темы (react context value)
export interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	actualTheme: ActualTheme;
	colorScheme: ColorScheme;
	setColorScheme: (scheme: ColorScheme) => void;
	isLoading: boolean;
}

// Пропсы для ThemeProvider-компонента
export interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	defaultColorScheme?: ColorScheme;
	/** Значения из cookie (серверный layout) — совпадают с первым кадром и убирают FOUC. */
	initialTheme?: Theme;
	initialColorScheme?: ColorScheme;
	/** Если в запросе был cookie темы — не перезаписывать предпочтение из localStorage при гидрации. */
	themePreferenceFromCookie?: boolean;
	colorSchemePreferenceFromCookie?: boolean;
	storageKey?: string;
	colorSchemeStorageKey?: string;
}
