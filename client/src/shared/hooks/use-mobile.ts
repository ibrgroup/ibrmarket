import * as React from 'react';

// Точка останова для мобильных устройств
const MOBILE_BREAKPOINT = 768;
// Точка останова для xs-устройств
const XS_BREAKPOINT = 360;

export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener('change', onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return !!isMobile;
}

export function useIsXs() {
	const [isXs, setIsXs] = React.useState<boolean | undefined>(undefined);

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${XS_BREAKPOINT - 1}px)`);
		const onChange = () => {
			setIsXs(window.innerWidth < XS_BREAKPOINT);
		};
		mql.addEventListener('change', onChange);
		setIsXs(window.innerWidth < XS_BREAKPOINT);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return !!isXs;
}
