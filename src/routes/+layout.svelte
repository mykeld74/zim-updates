<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/css/reset.css';
	import '$lib/css/styles.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="appLayout">
	<main class="mainContent">
		{@render children?.()}
	</main>
</div>

<style>
	.appLayout {
		display: flex;
		min-height: 100vh;
	}

	.mainContent {
		flex: 1;
		overflow-y: auto;
	}
</style>
