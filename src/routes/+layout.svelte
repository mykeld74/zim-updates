<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/css/reset.css';
	import '$lib/css/styles.css';
	import { Nav } from '$lib';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Stay connected with our friends in Zimbabwe. Latest news and updates from our community." />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Zim Updates" />
	<meta name="twitter:card" content="summary_large_image" />
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
