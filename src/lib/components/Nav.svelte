<script lang="ts">
	import { resolveRoute } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { signOut, useSession } from '$lib';

	interface Props {
		isApprovedStaff?: boolean;
		theme?: 'light' | 'dark';
		onThemeToggle?: () => void;
	}

	let {
		isApprovedStaff = false,
		theme = 'light',
		onThemeToggle
	}: Props = $props();

	const currentPath = $derived($page.url.pathname);
	const session = useSession();
	const isLoggedIn = $derived(!!$session?.data?.user);
	let mobileMenuOpen = $state(false);
	let accountMenuOpen = $state(false);

	const navLinkItems = $derived.by(() => {
		const links = [
			{ href: resolveRoute('/'), label: 'Home', active: currentPath === '/' },
			{ href: resolveRoute('/updates'), label: 'Updates', active: currentPath === '/updates' },
			{
				href: resolveRoute('/prayer-sponsor'),
				label: 'Become a Prayer Sponsor',
				active: currentPath === '/prayer-sponsor'
			}
		];

		if (isLoggedIn) {
			links.push({
				href: resolveRoute('/sponsor'),
				label: 'My sponsorship',
				active: currentPath.startsWith('/sponsor')
			});
		}

		if (isLoggedIn && isApprovedStaff) {
			links.push({
				href: resolveRoute('/admin'),
				label: 'Admin',
				active: currentPath.startsWith('/admin')
			});
		}

		return links;
	});

	onMount(() => {
		gsap.from('.navItem', {
			opacity: 0,
			y: -10,
			duration: 0.5,
			stagger: 0.1,
			ease: 'power2.out'
		});
	});

	async function handleLogout() {
		await signOut();
		accountMenuOpen = false;
		await goto(resolveRoute('/'));
	}
</script>

<nav class="nav" aria-label="Main navigation">
	<div class="navInner">
		<ul class="navList desktopOnly">
			{#each navLinkItems as link (link.href)}
				<li class="navItem">
					<a href={link.href} class="navLink" class:active={link.active}>{link.label}</a>
				</li>
			{/each}
		</ul>

		<div class="accountMenu desktopOnly">
			<button
				type="button"
				class="themeToggleButton"
				aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				onclick={() => onThemeToggle?.()}
			>
				{#if theme === 'light'}
					<svg viewBox="0 0 24 24" aria-hidden="true" class="themeIcon">
						<path
							d="M21 12.79A9 9 0 0 1 11.21 3A7.5 7.5 0 1 0 21 12.79Z"
							fill="currentColor"
						></path>
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" aria-hidden="true" class="themeIcon">
						<circle cx="12" cy="12" r="4" fill="currentColor"></circle>
						<path
							d="M12 2v2.2M12 19.8V22M4.22 4.22l1.56 1.56M18.22 18.22l1.56 1.56M2 12h2.2M19.8 12H22M4.22 19.78l1.56-1.56M18.22 5.78l1.56-1.56"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							fill="none"
						></path>
					</svg>
				{/if}
			</button>
			<button
				type="button"
				class="accountButton"
				aria-label="Open account menu"
				aria-expanded={accountMenuOpen}
				aria-controls="desktopAccountMenu"
				onclick={() => (accountMenuOpen = !accountMenuOpen)}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true" class="accountIcon">
					<path
						d="M12 12.75A5.25 5.25 0 1 0 12 2.25a5.25 5.25 0 0 0 0 10.5Zm0 1.5c-4.556 0-8.25 2.742-8.25 6.125 0 .345.28.625.625.625h15.25a.625.625 0 0 0 .625-.625c0-3.383-3.694-6.125-8.25-6.125Z"
					></path>
				</svg>
			</button>
			{#if accountMenuOpen}
				<div id="desktopAccountMenu" class="accountDropdown">
					{#if isLoggedIn}
						<button type="button" class="accountMenuAction" onclick={handleLogout}>Log out</button>
					{:else}
						<a
							href={resolveRoute('/login')}
							class="accountMenuAction"
							onclick={() => (accountMenuOpen = false)}
						>
							Log in
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<div class="mobileOnly mobileNav">
			<button
				type="button"
				class="menuButton"
				aria-expanded={mobileMenuOpen}
				aria-controls="mobileNavMenu"
				aria-label="Toggle navigation menu"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			>
				<span class="menuButtonLine"></span>
				<span class="menuButtonLine"></span>
				<span class="menuButtonLine"></span>
			</button>
		</div>
	</div>

	{#if mobileMenuOpen}
		<div id="mobileNavMenu" class="mobileMenu mobileOnly">
			<ul class="mobileMenuList">
				{#each navLinkItems as link (link.href)}
					<li class="navItem">
						<a
							href={link.href}
							class="navLink"
							class:active={link.active}
							onclick={() => (mobileMenuOpen = false)}
						>
							{link.label}
						</a>
					</li>
				{/each}
				{#if isLoggedIn}
					<li class="navItem">
						<button type="button" class="navLink mobileAuthAction" onclick={() => onThemeToggle?.()}>
							{#if theme === 'light'}
								<svg viewBox="0 0 24 24" aria-hidden="true" class="themeIcon">
									<path
										d="M21 12.79A9 9 0 0 1 11.21 3A7.5 7.5 0 1 0 21 12.79Z"
										fill="currentColor"
									></path>
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" aria-hidden="true" class="themeIcon">
									<circle cx="12" cy="12" r="4" fill="currentColor"></circle>
									<path
										d="M12 2v2.2M12 19.8V22M4.22 4.22l1.56 1.56M18.22 18.22l1.56 1.56M2 12h2.2M19.8 12H22M4.22 19.78l1.56-1.56M18.22 5.78l1.56-1.56"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										fill="none"
									></path>
								</svg>
							{/if}
						</button>
					</li>
					<li class="navItem">
						<button
							type="button"
							class="navLink mobileAuthAction"
							onclick={() => {
								mobileMenuOpen = false;
								handleLogout();
							}}
						>
							Log out
						</button>
					</li>
				{:else}
					<li class="navItem">
						<button type="button" class="navLink mobileAuthAction" onclick={() => onThemeToggle?.()}>
							{#if theme === 'light'}
								<svg viewBox="0 0 24 24" aria-hidden="true" class="themeIcon">
									<path
										d="M21 12.79A9 9 0 0 1 11.21 3A7.5 7.5 0 1 0 21 12.79Z"
										fill="currentColor"
									></path>
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" aria-hidden="true" class="themeIcon">
									<circle cx="12" cy="12" r="4" fill="currentColor"></circle>
									<path
										d="M12 2v2.2M12 19.8V22M4.22 4.22l1.56 1.56M18.22 18.22l1.56 1.56M2 12h2.2M19.8 12H22M4.22 19.78l1.56-1.56M18.22 5.78l1.56-1.56"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										fill="none"
									></path>
								</svg>
							{/if}
						</button>
					</li>
					<li class="navItem">
						<a
							href={resolveRoute('/login')}
							class="navLink"
							class:active={currentPath === '/login'}
							onclick={() => (mobileMenuOpen = false)}
						>
							Log in
						</a>
					</li>
				{/if}
			</ul>
		</div>
	{/if}
</nav>

<style>
	.nav {
		background: oklch(from var(--surfaceColor) l c h / 0.65);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--borderColor);
		padding: var(--spacing-md) var(--spacing-lg);
		position: sticky;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		box-shadow: var(--shadow-sm);
	}

	.navInner {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: var(--spacing-md);
	}

	.navList {
		display: flex;
		gap: var(--spacing-lg);
		list-style: none;
		margin: 0;
		padding: 0;
		align-items: center;
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

	.desktopOnly {
		display: inline-flex;
	}

	.mobileOnly {
		display: none;
	}

	.mobileMenu {
		margin-top: var(--spacing-sm);
		border-top: 1px solid var(--borderColor);
		padding-top: var(--spacing-sm);
	}

	.mobileMenuList {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--spacing-xs);
	}

	.mobileNav {
		justify-self: end;
	}

	.menuButton {
		border: 1px solid var(--borderColor);
		background: var(--surfaceColor);
		border-radius: var(--radius-md);
		padding: 0.45rem;
		display: grid;
		gap: 0.2rem;
		cursor: pointer;
	}

	.menuButtonLine {
		width: 1rem;
		height: 2px;
		background: var(--textColor);
		display: block;
	}

	.accountMenu {
		position: relative;
		justify-self: end;
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.themeToggleButton {
		border: 1px solid var(--borderColor);
		background: var(--surfaceColor);
		color: var(--textColor);
		border-radius: 999px;
		width: 2.1rem;
		height: 2.1rem;
		display: grid;
		place-items: center;
	}

	.themeToggleButton:hover {
		background: oklch(from var(--primaryColor) l c h / 0.1);
		color: var(--primaryColor);
	}

	.themeIcon {
		width: 1rem;
		height: 1rem;
		display: block;
	}

	.accountButton {
		border: 1px solid var(--borderColor);
		background: var(--surfaceColor);
		color: var(--textColor);
		border-radius: 999px;
		padding: 0.35rem;
		width: 2.1rem;
		height: 2.1rem;
		display: grid;
		place-items: center;
		cursor: pointer;
	}

	.accountButton:hover {
		background: oklch(from var(--primaryColor) l c h / 0.1);
		color: var(--primaryColor);
	}

	.accountIcon {
		width: 1.1rem;
		height: 1.1rem;
		fill: currentColor;
	}

	.accountDropdown {
		position: absolute;
		top: calc(100% + 0.45rem);
		right: 0;
		background: var(--surfaceColor);
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
		padding: 0.35rem;
		min-width: 8rem;
		z-index: 10;
	}

	.accountMenuAction {
		display: block;
		width: 100%;
		text-align: left;
		text-decoration: none;
		background: transparent;
		border: none;
		color: var(--textColor);
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.55rem;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.accountMenuAction:hover {
		background: oklch(from var(--primaryColor) l c h / 0.1);
		color: var(--primaryColor);
	}

	.mobileAuthAction {
		width: 100%;
		text-align: left;
	}

	@media (max-width: 768px) {
		.nav {
			padding: var(--spacing-sm) var(--spacing-md);
		}

		.navLink {
			font-size: 0.875rem;
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.desktopOnly {
			display: none;
		}

		.mobileOnly {
			display: block;
		}
	}
</style>
