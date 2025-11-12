<script>
	let { source, altTag, width = 'auto', class: className = '' } = $props();

	const imageUrl = `https://res.cloudinary.com/bigbeardeddev/image/upload/f_auto,q_auto,w_${width}/v1/${source}`;
</script>

<img src={imageUrl} alt={altTag} class="{source} {className}" loading="lazy" />

<style>
</style>
