'use client';

import { cn } from '@/shared/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
	size?: 'sm' | 'md' | 'lg';
	text?: string;
	className?: string;
}

const sizeClasses = {
	sm: 'w-4 h-4',
	md: 'w-6 h-6',
	lg: 'w-8 h-8',
};

export function Loading({ size = 'md', text, className }: LoadingProps) {
	return (
		<div className={cn('flex items-center justify-center gap-2', className)}>
			<Loader2 className={cn('animate-spin', sizeClasses[size])} />
			{text && <span className="text-sm text-muted-foreground">{text}</span>}
		</div>
	);
}

// Специализированные компоненты загрузки
export function PageLoading({ className }: { className?: string }) {
	return (
		<div className={cn('flex items-center justify-center min-h-[400px]', className)}>
			<Loading size="lg" text="Загрузка..." />
		</div>
	);
}

export function ButtonLoading({ className }: { className?: string }) {
	return (
		<div className={cn('flex items-center justify-center p-4', className)}>
			<Loading size="sm" text="Загрузка..." />
		</div>
	);
}

export function InlineLoading({ className }: { className?: string }) {
	return (
		<div className={cn('inline-flex items-center gap-2', className)}>
			<Loading size="sm" />
		</div>
	);
}
