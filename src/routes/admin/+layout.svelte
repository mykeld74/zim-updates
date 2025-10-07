<script lang="ts">
	import { signOut } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	const { data, children } = $props();

	async function handleLogout() {
		await signOut();
		goto('/login');
	}
</script>

<div class="adminLayout">
	<header class="adminHeader">
		<div class="headerContent">
			<h1>Admin Panel</h1>
			<div class="userInfo">
				<span class="userName">{data.user?.name || data.user?.email}</span>
				<button onclick={handleLogout} class="logoutButton">Logout</button>
			</div>
		</div>
	</header>

	<nav class="adminNav">
		<a href="/admin/kids" class="navLink">Kids</a>
		<a href="/admin/media" class="navLink">Media</a>
		<a href="/admin/sponsors" class="navLink">Sponsors</a>
	</nav>

	<main class="adminContent">
		{@render children?.()}
	</main>
</div>

<style>
	.adminLayout {
		min-height: 100vh;
		background: var(--backgroundColor);
	}

	.adminHeader {
		background: var(--surfaceColor);
		border-bottom: 1px solid oklch(0.8 0.02 var(--hue));
		padding: var(--spacing-lg) 0;
	}

	.headerContent {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--spacing-lg);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.adminHeader h1 {
		color: var(--primaryColor);
		margin: 0;
	}

	.userInfo {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.userName {
		color: var(--textMuted);
		font-size: 0.9rem;
	}

	.logoutButton {
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		color: var(--primaryColor);
		border: 1px solid var(--primaryColor);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
		font-weight: 500;
	}

	.logoutButton:hover {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.adminNav {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--spacing-lg);
		display: flex;
		gap: var(--spacing-md);
	}

	.navLink {
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--surfaceColor);
		color: var(--textColor);
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
		font-weight: 500;
	}

	.navLink:hover {
		background: var(--primaryColor);
		color: var(--contrastColor);
		transform: translateY(-2px);
	}

	.adminContent {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--spacing-lg);
	}
</style>
