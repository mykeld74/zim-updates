<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();

	let loading = $state<string | null>(null);

	async function handleApprove(userId: string, approved: boolean) {
		loading = userId;

		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ approved })
			});

			if (!response.ok) {
				throw new Error('Failed to update user');
			}

			await invalidateAll();
		} catch (err) {
			console.error('Error updating user:', err);
			alert('Failed to update user. Please try again.');
		} finally {
			loading = null;
		}
	}

	const pendingUsers = $derived(data.users.filter((u) => !u.approved));
	const approvedUsers = $derived(data.users.filter((u) => u.approved));
</script>

<div class="usersPage">
	<h1>User Management</h1>

	{#if pendingUsers.length > 0}
		<section class="section">
			<h2>Pending Approval ({pendingUsers.length})</h2>
			<div class="userList">
				{#each pendingUsers as user}
					<div class="userCard">
						<div class="userInfo">
							<h3>{user.name}</h3>
							<p class="email">{user.email}</p>
							<p class="date">Signed up: {new Date(user.createdAt).toLocaleDateString()}</p>
						</div>
						<div class="userActions">
							<button
								onclick={() => handleApprove(user.id, true)}
								disabled={loading === user.id}
								class="approveButton"
							>
								{loading === user.id ? 'Processing...' : 'Approve'}
							</button>
							<button
								onclick={() => handleApprove(user.id, false)}
								disabled={loading === user.id}
								class="rejectButton"
							>
								Reject
							</button>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if approvedUsers.length > 0}
		<section class="section">
			<h2>Approved Users ({approvedUsers.length})</h2>
			<div class="userList">
				{#each approvedUsers as user}
					<div class="userCard approved">
						<div class="userInfo">
							<h3>{user.name}</h3>
							<p class="email">{user.email}</p>
							<p class="date">Signed up: {new Date(user.createdAt).toLocaleDateString()}</p>
						</div>
						<div class="userActions">
							<button
								onclick={() => handleApprove(user.id, false)}
								disabled={loading === user.id}
								class="revokeButton"
							>
								{loading === user.id ? 'Processing...' : 'Revoke Access'}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if pendingUsers.length === 0 && approvedUsers.length === 0}
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

	.userCard.approved {
		border-left: 4px solid oklch(0.6 0.15 140);
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

	.userActions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.approveButton {
		padding: var(--spacing-sm) var(--spacing-md);
		background: oklch(0.6 0.15 140);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 500;
		transition: all var(--transition-base);
	}

	.approveButton:hover:not(:disabled) {
		background: oklch(0.55 0.15 140);
		transform: translateY(-1px);
	}

	.rejectButton {
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		color: oklch(0.5 0.15 20);
		border: 1px solid oklch(0.5 0.15 20);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 500;
		transition: all var(--transition-base);
	}

	.rejectButton:hover:not(:disabled) {
		background: oklch(0.5 0.15 20);
		color: white;
	}

	.revokeButton {
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		color: oklch(0.5 0.15 20);
		border: 1px solid oklch(0.5 0.15 20);
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 500;
		transition: all var(--transition-base);
	}

	.revokeButton:hover:not(:disabled) {
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

