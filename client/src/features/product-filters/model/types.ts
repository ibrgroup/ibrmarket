export interface FilterState {
	categories: string[];
	brands: string[];
	priceRange: [number, number];
	rating: number;
	inStock: boolean | null;
	sortBy: 'name' | 'price' | 'rating' | 'createdAt';
	sortOrder: 'asc' | 'desc';
}

export interface FilterOption {
	value: string;
	label: string;
	count?: number;
}

export interface CategoryFilter extends FilterOption {
	children?: CategoryFilter[];
}

export interface BrandFilter extends FilterOption {
	logo?: string;
}

export interface PriceRange {
	min: number;
	max: number;
	step: number;
}

export interface FilterCounts {
	categories: Record<string, number>;
	brands: Record<string, number>;
	priceRange: [number, number];
}
