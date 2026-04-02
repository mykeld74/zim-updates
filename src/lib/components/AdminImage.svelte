<script lang="ts">
	interface Props {
		source: string;
		altTag: string;
		width?: string;
		height?: string;
		faceCrop?: boolean;
		faceZoom?: string;
		class?: string;
	}

	let {
		source,
		altTag,
		width = 'auto',
		height = 'auto',
		faceCrop = false,
		faceZoom = '1.4',
		class: className = ''
	}: Props = $props();
	const normalizedSource = $derived(source?.trim() || '');
	const transform = $derived.by(() => {
		const parts = ['f_auto', 'q_auto'];
		if (width !== 'auto') parts.push(`w_${width}`);
		if (height !== 'auto') parts.push(`h_${height}`);
		if (faceCrop && width !== 'auto' && height !== 'auto') {
			parts.push('c_thumb', 'g_face', `z_${faceZoom}`);
		}
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
