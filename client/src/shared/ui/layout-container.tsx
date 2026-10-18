'use client';

import { cn } from '@/shared/lib/utils';

interface LayoutContainerProps {
	children: React.ReactNode;
	className?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	padding?: boolean;
}

const sizeClasses = {
	sm: 'max-w-2xl',
	md: 'max-w-4xl',
	lg: 'max-w-6xl',
	xl: 'max-w-7xl',
	full: 'max-w-none',
};

export function LayoutContainer({
	children,
	className,
	size = 'lg',
	padding = true,
}: LayoutContainerProps) {
	return (
		<div
			className={cn(
				'mx-auto w-full',
				sizeClasses[size],
				padding && 'px-4 sm:px-6 lg:px-8',
				className
			)}>
			{children}
		</div>
	);
}

// Специализированные контейнеры
export function PageContainer({ children, className, ...props }: LayoutContainerProps) {
	return (
		<LayoutContainer size="lg" className={cn('py-8', className)} {...props}>
			{children}
		</LayoutContainer>
	);
}

export function SectionContainer({ children, className, ...props }: LayoutContainerProps) {
	return (
		<LayoutContainer size="full" className={cn('py-12', className)} {...props}>
			{children}
		</LayoutContainer>
	);
}

export function ContentContainer({ children, className, ...props }: LayoutContainerProps) {
	return (
		<LayoutContainer size="md" className={cn('py-6', className)} {...props}>
			{children}
		</LayoutContainer>
	);
}
