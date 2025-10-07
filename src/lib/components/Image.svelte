<script>
	let { source, altTag, width = 'auto', class: className = '' } = $props();

	let src = `https://res.cloudinary.com/bigbeardeddev/image/upload/f_auto,q_auto,w_${width}/${source}`;
</script>

<img {src} alt={altTag} class="{source} {className}" loading="lazy" />

<style>
</style>
