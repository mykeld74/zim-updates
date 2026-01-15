<script lang="ts">
	interface Props {
		source: string;
		altTag: string;
		width?: string;
		class?: string;
	}

	let { source, altTag, width = 'auto', class: className = '' }: Props = $props();

	const imageUrl = $derived(
		`https://res.cloudinary.com/bigbeardeddev/image/upload/f_auto,q_auto,w_${width}/v1/${source}`
	);
</script>

<img src={imageUrl} alt={altTag} class="adminImage {className}" loading="lazy" />

<style>
	.adminImage {
		max-width: 100%;
		height: auto;
	}
</style>
