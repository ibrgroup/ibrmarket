import React, { useState, memo } from 'react';
import { CarouselItem } from '@/shared/ui/carousel';
import type { Slide, SlideState } from '../model/types';
import { CAROUSEL_CONFIG, CAROUSEL_CONSTANTS } from '../model/config';
import {
	calculateSlideStyle,
	calculateSlideShadow,
	isSlideInteractive,
} from '../lib/utils/slide-calculator';

interface CarouselSlideProps {
	slide: Slide;
	index: number;
	state: SlideState;
	onClick: (index: number) => void;
}

/**
 * Мемоизированный компонент слайда карусели
 * Оптимизирован для минимизации ре-рендеров
 */
const CarouselSlide: React.FC<CarouselSlideProps> = memo(
	({ slide, index, state, onClick }) => {
		const [imageError, setImageError] = useState(false);
		const [imageLoaded, setImageLoaded] = useState(false);

		const style = calculateSlideStyle(state);
		const shadow = calculateSlideShadow(state);
		const interactive = isSlideInteractive(state);

		const handleClick = () => {
			if (interactive && !imageError) {
				onClick(index);
			}
		};

		const handleImageError = () => {
			setImageError(true);
			console.error(`[CarouselSlide] Failed to load image for slide ${slide.id}`);
		};

		const handleImageLoad = () => {
			setImageLoaded(true);
		};

		return (
			<CarouselItem
				className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/3 pl-0 pr-0 flex-shrink-0"
				style={{
					transition: CAROUSEL_CONFIG.transitions.default,
					...style,
					pointerEvents: interactive ? 'auto' : 'none',
				}}>
				<div
					className={`w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] relative overflow-hidden ${
						interactive && !imageError ? 'cursor-pointer' : 'cursor-default'
					}`}
					style={{
						transition: CAROUSEL_CONFIG.transitions.smooth,
						borderRadius: `${CAROUSEL_CONSTANTS.SLIDE_BORDER_RADIUS}px`,
						boxShadow: shadow,
					}}
					onClick={handleClick}
					role="button"
					tabIndex={interactive ? 0 : -1}
					aria-label={`Slide ${index + 1}: ${slide.title}`}>
					{/* Skeleton loader */}
					{!imageLoaded && !imageError && (
						<div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/80 to-muted animate-pulse" />
					)}

					{/* Изображение */}
					{!imageError ? (
						<img
							src={slide.image}
							alt={slide.title}
							className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
							loading="lazy"
							draggable={false}
							onError={handleImageError}
							onLoad={handleImageLoad}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								display: imageLoaded ? 'block' : 'none',
							}}
						/>
					) : (
						/* Fallback при ошибке загрузки */
						<div className="w-full h-full flex items-center justify-center bg-muted">
							<div className="text-center p-4">
								<svg
									className="w-12 h-12 mx-auto mb-2 text-muted-foreground"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<p className="text-sm text-muted-foreground">Не удалось загрузить изображение</p>
							</div>
						</div>
					)}

					{/* Индикатор центрального слайда */}
					{state.isCenter && !imageError && (
						<div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
							<div className="w-2 h-2 bg-white rounded-full shadow-md" />
						</div>
					)}

					{/* Информация о товаре (опционально) */}
					{state.isCenter && !imageError && (
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
							<p className="text-white text-sm font-semibold truncate">{slide.title}</p>
							<div className="flex items-center gap-2 mt-1">
								<span className="text-white text-lg font-bold">{slide.priceCurrent}</span>
								{slide.priceOld && (
									<span className="text-gray-300 text-sm line-through">{slide.priceOld}</span>
								)}
								{slide.discount && (
									<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">
										{slide.discount}
									</span>
								)}
							</div>
						</div>
					)}
				</div>
			</CarouselItem>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison для оптимизации
		return (
			prevProps.slide.id === nextProps.slide.id &&
			prevProps.index === nextProps.index &&
			prevProps.state.isCenter === nextProps.state.isCenter &&
			prevProps.state.isVisible === nextProps.state.isVisible &&
			prevProps.state.isAdjacent === nextProps.state.isAdjacent
		);
	}
);

CarouselSlide.displayName = 'CarouselSlide';

export default CarouselSlide;
