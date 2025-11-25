<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/css/reset.css';
	import '$lib/css/styles.css';
	import { Nav } from '$lib';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="appLayout">
	<Nav />
	<main class="mainContent">
		{@render children?.()}
	</main>
</div>

<style>
	.appLayout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.mainContent {
		flex: 1;
		overflow-y: auto;
	}
</style>
