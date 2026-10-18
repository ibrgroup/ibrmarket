/**
 * Логика работы с цветовыми схемами
 */

import { colors } from './colors';
import type { ColorScheme, SemanticColorType, ColorShade, ActualTheme } from './types';

/**
 * Получить цветовую схему по имени
 */
export const getColorScheme = (scheme: ColorScheme) => colors.schemes[scheme];

/**
 * Получить семантический цвет
 */
export const getSemanticColor = (type: SemanticColorType, theme: ActualTheme = 'light') =>
	colors.semantic[type][theme];

/**
 * Получить серый цвет
 */
export const getGrayColor = (shade: ColorShade, theme: ActualTheme = 'light') =>
	theme === 'dark' ? colors.grayDark[shade] : colors.gray[shade];

/**
 * Получить основной цвет
 */
export const getPrimaryColor = (shade: ColorShade) =>
	colors.primary[shade as keyof typeof colors.primary];

/**
 * Получить все доступные цветовые схемы
 */
export const getAvailableColorSchemes = (): ColorScheme[] => [
	'violet',
	'blue',
	'green',
	'orange',
	'slate',
	'yellow',
	'pink',
	'teal',
	'indigo',
];

/**
 * Проверить, является ли схема допустимой
 */
export const isValidColorScheme = (scheme: string): scheme is ColorScheme => {
	return getAvailableColorSchemes().includes(scheme as ColorScheme);
};
