<script>
	let { source, altTag, width = 'auto', class: className = '' } = $props();
</script>

<img src={source} alt={altTag} class="{source} {className}" loading="lazy" />

<style>
</style>
