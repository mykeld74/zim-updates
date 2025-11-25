<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	const currentPath = $derived($page.url.pathname);

	onMount(() => {
		gsap.from('.navItem', {
			opacity: 0,
			y: -10,
			duration: 0.5,
			stagger: 0.1,
			ease: 'power2.out'
		});
	});
</script>

<nav class="nav" aria-label="Main navigation">
	<ul class="navList">
		<li class="navItem">
			<a href="/" class="navLink" class:active={currentPath === '/'}> Home </a>
		</li>
		<li class="navItem">
			<a href="/updates" class="navLink" class:active={currentPath === '/updates'}> Updates </a>
		</li>
	</ul>
</nav>

<style>
	.nav {
		background: oklch(from var(--surfaceColor) l c h / 0.65);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--borderColor);
		padding: var(--spacing-md) var(--spacing-lg);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		box-shadow: var(--shadow-sm);
	}

	.navList {
		display: flex;
		gap: var(--spacing-lg);
		list-style: none;
		margin: 0;
		padding: 0;
		max-width: 1200px;
		margin: 0 auto;
	}

	.navItem {
		margin: 0;
	}

	.navLink {
		display: inline-block;
		padding: var(--spacing-sm) var(--spacing-md);
		color: var(--textColor);
		text-decoration: none;
		font-weight: 500;
		border-radius: var(--radius-md);
		transition:
			color var(--transition-fast),
			background-color var(--transition-fast);
		position: relative;
	}

	.navLink:hover {
		color: var(--primaryColor);
		background-color: oklch(from var(--primaryColor) l c h / 0.1);
	}

	.navLink.active {
		color: var(--primaryColor);
		background-color: oklch(from var(--primaryColor) l c h / 0.15);
	}

	.navLink:focus-visible {
		outline: 2px solid var(--primaryColor);
		outline-offset: 2px;
	}

	@media (max-width: 768px) {
		.nav {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.navList {
			gap: var(--spacing-md);
		}

		.navLink {
			font-size: 0.875rem;
			padding: var(--spacing-xs) var(--spacing-sm);
		}
	}
</style>
