declare module 'gsap' {
	const gsap: {
		from: (...args: unknown[]) => unknown;
		killTweensOf: (...args: unknown[]) => void;
	};

	export default gsap;
	export { gsap };
}

