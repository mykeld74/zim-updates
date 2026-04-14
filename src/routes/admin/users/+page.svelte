<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();

	let loading = $state<string | null>(null);

	async function handleDelete(userId: string, userName: string) {
		const confirmed = window.confirm(`Delete ${userName}'s account? This cannot be undone.`);
		if (!confirmed) return;

		loading = userId;

		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete user');
			}

			await invalidateAll();
		} catch (err) {
			console.error('Error deleting user:', err);
			alert('Failed to delete user. Please try again.');
		} finally {
			loading = null;
		}
	}
</script>

<svelte:head>
	<title>User Management - Admin - Zim Updates</title>
	<meta name="description" content="Manage user accounts and approvals in the admin panel." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="usersPage">
	<h1>User Management</h1>

	{#if data.users.length > 0}
		<section class="section">
			<h2>All Users ({data.users.length})</h2>
			<div class="userList">
				{#each data.users as user}
					<div class="userCard">
						<div class="userInfo">
							<h3>{user.name}</h3>
							<p class="email">{user.email}</p>
							<p class="date">Signed up: {new Date(user.createdAt).toLocaleDateString()}</p>
							<p class="status">{user.emailVerified ? 'Verified' : 'Not verified yet'}</p>
						</div>
						<div class="userActions">
							<button
								onclick={() => handleDelete(user.id, user.name)}
								disabled={loading === user.id}
								class="deleteButton"
							>
								{loading === user.id ? 'Deleting...' : 'Delete user'}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<p class="empty">No users found.</p>
	{/if}
</div>

<style>
	.usersPage {
		animation: cardsIn var(--transition-base);
	}

	h1 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-2xl);
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.section {
		margin-bottom: var(--spacing-2xl);
	}

	.section h2 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-lg);
		font-size: 1.5rem;
	}

	.userList {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.userCard {
		background: var(--surfaceColor);
		padding: var(--spacing-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-lg);
		transition: all var(--transition-base);
	}

	.userCard:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.userInfo {
		flex: 1;
	}

	.userInfo h3 {
		color: var(--textColor);
		margin: 0 0 var(--spacing-xs) 0;
		font-size: 1.2rem;
	}

	.email {
		color: var(--textMuted);
		margin: 0 0 var(--spacing-xs) 0;
	}

	.date {
		color: var(--textMuted);
		margin: 0;
		font-size: 0.9rem;
	}

	.status {
		margin: var(--spacing-xs) 0 0;
		font-size: 0.85rem;
		color: var(--textMuted);
	}

	.userActions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.deleteButton {
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		color: oklch(0.5 0.15 20);
		border: 1px solid oklch(0.5 0.15 20);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 500;
		transition: all var(--transition-base);
	}

	.deleteButton:hover:not(:disabled) {
		background: oklch(0.5 0.15 20);
		color: white;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.empty {
		text-align: center;
		color: var(--textMuted);
		padding: var(--spacing-2xl);
	}
</style>

