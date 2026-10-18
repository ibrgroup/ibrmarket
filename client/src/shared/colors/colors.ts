/**
 * Цветовая палитра для IBR-MARKET
 * Централизованное управление цветами
 */

import type { ColorPalette, ColorShades, ColorScales, SemanticColors } from './types';

// Цветовая палитра (синхронизирована с globals.css)
export const colors: ColorPalette = {
	primary: {
		50: '#f5f3ff',
		100: '#ede9fe',
		200: '#ddd6fe',
		300: '#c4b5fd',
		400: '#a78bfa',
		500: '#8b5cf6',
		600: '#7c3aed',
		700: '#6d28d9',
		800: '#5b21b6',
		900: '#4c1d95',
	} as ColorShades,

	background: {
		50: '#ffffff',
		100: '#f9fafb',
		200: '#f3f4f6',
		300: '#e5e7eb',
		400: '#d1d5db',
		500: '#9ca3af',
		600: '#6b7280',
		700: '#374151',
		800: '#1f2937',
		900: '#111827',
	} as ColorShades,

	foreground: {
		50: '#111827',
		100: '#1f2937',
		200: '#374151',
		300: '#4b5563',
		400: '#6b7280',
		500: '#9ca3af',
		600: '#d1d5db',
		700: '#f9fafb',
	} as ColorShades,

	border: {
		50: '#f8fafc',
		100: '#f1f5f9',
		200: '#e2e8f0',
		300: '#cbd5e1',
		400: '#94a3b8',
		500: '#64748b',
		600: '#475569',
		700: '#334155',
		800: '#1e293b',
		900: '#0f172a',
	} as ColorShades,

	muted: {
		50: '#f8fafc',
		100: '#f1f5f9',
		200: '#e2e8f0',
		300: '#cbd5e1',
		400: '#94a3b8',
		500: '#64748b',
		600: '#475569',
		700: '#334155',
		800: '#1e293b',
	} as ColorShades,

	gray: {
		50: '#f8fafc',
		100: '#f1f5f9',
		200: '#e2e8f0',
		300: '#cbd5e1',
		400: '#94a3b8',
		500: '#64748b',
		600: '#475569',
		700: '#334155',
		800: '#1e293b',
		900: '#0f172a',
		950: '#020617',
	} as ColorScales,

	grayDark: {
		50: '#0f172a',
		100: '#111827',
		200: '#1f2937',
		300: '#273449',
		400: '#334155',
		500: '#475569',
		600: '#64748b',
		700: '#94a3b8',
		800: '#cbd5e1',
		900: '#e2e8f0',
		950: '#f8fafc',
	} as ColorScales,

	success: {
		50: '#ecfdf5',
		100: '#d1fae5',
		200: '#a7f3d0',
		300: '#6ee7b7',
		400: '#34d399',
	} as ColorShades,

	warning: {
		50: '#fffbeb',
		100: '#fef3c7',
		200: '#fde68a',
		300: '#fcd34d',
		400: '#fbbf24',
	} as ColorShades,

	danger: {
		50: '#fef2f2',
		100: '#fee2e2',
		200: '#fecaca',
		300: '#fca5a5',
		400: '#f87171',
	} as ColorShades,

	info: {
		50: '#eff6ff',
		100: '#dbeafe',
		200: '#bfdbfe',
		300: '#93c5fd',
		400: '#60a5fa',
	} as ColorShades,

	semantic: {
		success: {
			light: '#34d399',
			dark: '#10b981',
		},
		warning: {
			light: '#fbbf24',
			dark: '#d97706',
		},
		error: {
			light: '#f87171',
			dark: '#ef4444',
		},
		info: {
			light: '#60a5fa',
			dark: '#3b82f6',
		},
	} as SemanticColors,

	schemes: {
		violet: {
			primary: {
				light: '#8b5cf6',
				dark: '#7c3aed',
			},
			foreground: {
				light: '#ffffff',
				dark: '#ffffff',
			},
		},
		blue: {
			primary: {
				light: '#3b82f6',
				dark: '#2563eb',
			},
			foreground: {
				light: '#ffffff',
				dark: '#ffffff',
			},
		},
		green: {
			primary: {
				light: '#22c55e',
				dark: '#16a34a',
			},
			foreground: {
				light: '#ffffff',
				dark: '#ffffff',
			},
		},
		orange: {
			primary: {
				light: '#f59e0b',
				dark: '#d97706',
			},
			foreground: {
				light: '#111827',
				dark: '#111827',
			},
		},
		slate: {
			primary: {
				light: '#64748b',
				dark: '#475569',
			},
			foreground: {
				light: '#ffffff',
				dark: '#ffffff',
			},
		},
		yellow: {
			primary: {
				light: '#f59e0b',
				dark: '#d97706',
			},
			foreground: {
				light: '#111827',
				dark: '#111827',
			},
		},
		pink: {
			primary: {
				light: '#ec4899',
				dark: '#db2777',
			},
			foreground: {
				light: '#ffffff',
				dark: '#ffffff',
			},
		},
		teal: {
			primary: {
				light: '#14b8a6',
				dark: '#0d9488',
			},
			foreground: {
				light: '#ffffff',
				dark: '#ffffff',
			},
		},
		indigo: {
			primary: {
				light: '#6366f1',
				dark: '#4f46e5',
			},
			foreground: {
				light: '#ffffff',
				dark: '#ffffff',
			},
		},
	},
};
