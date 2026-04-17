<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/css/reset.css';
	import '$lib/css/styles.css';
	import { Nav } from '$lib';
	import { onMount } from 'svelte';

	let { children, data } = $props();
	type Theme = 'light' | 'dark';
	const themeStorageKey = 'zimTheme';

	const isApprovedStaff = $derived(data.user?.role === 'admin');
	let theme = $state<Theme>('light');

	function applyTheme(nextTheme: Theme) {
		theme = nextTheme;
		if (typeof document === 'undefined') return;
		document.documentElement.dataset.theme = nextTheme;
		localStorage.setItem(themeStorageKey, nextTheme);
	}

	function toggleTheme() {
		applyTheme(theme === 'light' ? 'dark' : 'light');
	}

	onMount(() => {
		const savedTheme = localStorage.getItem(themeStorageKey);
		if (savedTheme === 'light' || savedTheme === 'dark') {
			applyTheme(savedTheme);
			return;
		}

		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyTheme(prefersDark ? 'dark' : 'light');
	});
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
	<Nav {isApprovedStaff} {theme} onThemeToggle={toggleTheme} />
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
