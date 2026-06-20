<script lang="ts">
	interface Props {
		source: string;
		altTag: string;
		width?: string;
		height?: string;
		aspectRatio?: string;
		faceCrop?: boolean;
		portrait?: boolean;
		faceZoom?: string;
		class?: string;
	}

	let {
		source,
		altTag,
		width = 'auto',
		height = 'auto',
		aspectRatio = '',
		faceCrop = false,
		portrait = false,
		faceZoom = '1.4',
		class: className = ''
	}: Props = $props();

	const parseAspectRatio = (ratio: string): number | null => {
		const match = ratio.trim().match(/^(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)$/);
		if (!match) return null;
		return Number(match[2]) / Number(match[1]);
	};

	const computeHeightFromAspectRatio = (widthValue: string, ratio: string): string | null => {
		const numericWidth = Number(widthValue);
		const heightRatio = parseAspectRatio(ratio);
		if (!Number.isFinite(numericWidth) || !heightRatio) return null;
		return String(Math.round(numericWidth * heightRatio));
	};

	const normalizedSource = $derived(source?.trim() || '');
	const transform = $derived.by(() => {
		const parts = ['f_auto', 'q_auto'];
		let cropWidth = width;
		let cropHeight = height;

		if (faceCrop && cropWidth !== 'auto' && cropHeight === 'auto' && aspectRatio) {
			const computedHeight = computeHeightFromAspectRatio(cropWidth, aspectRatio);
			if (computedHeight) cropHeight = computedHeight;
		}

		if (portrait && cropWidth !== 'auto') {
			parts.push('c_fill', 'g_face', `w_${cropWidth}`, `h_${cropWidth}`, 'r_max');
			if (faceZoom !== '1') parts.push(`z_${faceZoom}`);
			return parts.join(',');
		}

		if (faceCrop && cropWidth !== 'auto' && cropHeight !== 'auto') {
			parts.push('c_fill', 'g_face', `w_${cropWidth}`, `h_${cropHeight}`);
			if (faceZoom !== '1') parts.push(`z_${faceZoom}`);
			return parts.join(',');
		}

		if (cropWidth !== 'auto') parts.push(`w_${cropWidth}`);
		if (cropHeight !== 'auto') parts.push(`h_${cropHeight}`);
		return parts.join(',');
	});
	const imageUrl = $derived(
		normalizedSource.startsWith('http://') || normalizedSource.startsWith('https://')
			? normalizedSource
			: `https://res.cloudinary.com/bigbeardeddev/image/upload/${transform}/${normalizedSource}`
	);
</script>

<img src={imageUrl} alt={altTag} class="adminImage {className}" loading="lazy" />

<style>
	.adminImage {
		max-width: 100%;
		height: auto;
	}
</style>
