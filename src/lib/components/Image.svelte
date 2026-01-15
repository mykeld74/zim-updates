<script lang="ts">
	interface Props {
		source: string;
		altTag: string;
		width?: string;
		class?: string;
	}

	let { source, altTag, width = 'auto', class: className = '' }: Props = $props();
</script>

<img src={source} alt={altTag} class="image {className}" {width} loading="lazy" />

<style>
	.image {
		max-width: 100%;
		height: auto;
	}
</style>
