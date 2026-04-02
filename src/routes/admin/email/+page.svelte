<script lang="ts">
	import { formatKidDisplayName } from '$lib';
	import type { SponsorWithKids } from '$lib/server/sponsors';
	import type { UpdatePost } from '$lib/server/updates';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	const { data } = $props();

	// Tab state
	let activeTab = $state<'announcement' | 'compose'>('announcement');

	// Announcement form state
	let selectedUpdateId = $state<string>('');
	let announcementMessage = $state<string>('');
	let announcementMode = $state<'subscribed' | 'select'>('subscribed');
	let announcementRecipients = $state<string[]>([]);
	let announcementSending = $state(false);
	let announcementResult = $state<{ success: boolean; message: string } | null>(null);

	// Compose form state
	let composeSubject = $state('');
	let composeContent = $state('');
	let composeRecipients = $state<string[]>([]);
	let composeSending = $state(false);
	let composeResult = $state<{ success: boolean; message: string } | null>(null);

	// Computed values
	const subscribedSponsors = $derived(data.sponsors.filter((s: SponsorWithKids) => s.subscribed));
	const subscribedCount = $derived(subscribedSponsors.length);
	const selectedUpdate = $derived(data.updates.find((u: UpdatePost) => u.id === selectedUpdateId));

	// Announcement computed
	const announcementAllSelected = $derived(
		announcementRecipients.length === data.sponsors.length && data.sponsors.length > 0
	);
	const announcementRecipientCount = $derived(
		announcementMode === 'subscribed' ? subscribedCount : announcementRecipients.length
	);

	// Compose computed
	const composeAllSelected = $derived(
		composeRecipients.length === data.sponsors.length && data.sponsors.length > 0
	);

	// Announcement recipient functions
	function toggleAnnouncementSelectAll() {
		if (announcementAllSelected) {
			announcementRecipients = [];
		} else {
			announcementRecipients = data.sponsors.map((s: SponsorWithKids) => s.id);
		}
	}

	function toggleAnnouncementRecipient(id: string) {
		if (announcementRecipients.includes(id)) {
			announcementRecipients = announcementRecipients.filter((r) => r !== id);
		} else {
			announcementRecipients = [...announcementRecipients, id];
		}
	}

	function selectAnnouncementSubscribed() {
		announcementRecipients = subscribedSponsors.map((s: SponsorWithKids) => s.id);
	}

	// Compose recipient functions
	function toggleComposeSelectAll() {
		if (composeAllSelected) {
			composeRecipients = [];
		} else {
			composeRecipients = data.sponsors.map((s: SponsorWithKids) => s.id);
		}
	}

	function toggleComposeRecipient(id: string) {
		if (composeRecipients.includes(id)) {
			composeRecipients = composeRecipients.filter((r) => r !== id);
		} else {
			composeRecipients = [...composeRecipients, id];
		}
	}

	function selectComposeSubscribed() {
		composeRecipients = subscribedSponsors.map((s: SponsorWithKids) => s.id);
	}

	function sponsoredKidsLabel(sponsor: SponsorWithKids): string {
		const names =
			sponsor.kids?.map((k) => formatKidDisplayName(k.name, k.nickname)).filter(Boolean) ?? [];
		return names.join(', ');
	}

	async function sendAnnouncement() {
		if (!selectedUpdateId) {
			announcementResult = { success: false, message: 'Please select an update to announce' };
			return;
		}

		if (announcementMode === 'select' && announcementRecipients.length === 0) {
			announcementResult = { success: false, message: 'Please select at least one recipient' };
			return;
		}

		announcementSending = true;
		announcementResult = null;

		try {
			const body: Record<string, unknown> = {
				type: 'announcement',
				updateId: selectedUpdateId,
				message: announcementMessage.trim() || null
			};

			// If select mode, send specific recipients
			if (announcementMode === 'select') {
				body.recipientIds = announcementRecipients;
			}

			const response = await fetch('/api/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			const result = await response.json();

			if (response.ok) {
				announcementResult = { success: true, message: result.message };
				selectedUpdateId = '';
				announcementMessage = '';
				announcementRecipients = [];
			} else {
				announcementResult = { success: false, message: result.error || 'Failed to send email' };
			}
		} catch (error) {
			announcementResult = { success: false, message: 'An error occurred while sending' };
		} finally {
			announcementSending = false;
		}
	}

	async function sendCustomEmail() {
		if (!composeSubject.trim() || !composeContent.trim()) {
			composeResult = { success: false, message: 'Please enter a subject and message' };
			return;
		}

		if (composeRecipients.length === 0) {
			composeResult = { success: false, message: 'Please select at least one recipient' };
			return;
		}

		composeSending = true;
		composeResult = null;

		try {
			const response = await fetch('/api/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'custom',
					subject: composeSubject,
					content: composeContent,
					recipientIds: composeRecipients
				})
			});

			const result = await response.json();

			if (response.ok) {
				composeResult = { success: true, message: result.message };
				composeSubject = '';
				composeContent = '';
				composeRecipients = [];
			} else {
				composeResult = { success: false, message: result.error || 'Failed to send email' };
			}
		} catch (error) {
			composeResult = { success: false, message: 'An error occurred while sending' };
		} finally {
			composeSending = false;
		}
	}
</script>

<svelte:head>
	<title>Email Center - Admin - Zim Updates</title>
	<meta name="description" content="Manage email templates and send emails to sponsors from the admin panel." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="adminPage">
	<div class="header">
		<div>
			<h2>Email Center</h2>
			<p class="subtitle">Send updates and messages to sponsors</p>
		</div>
	</div>

	<!-- Tab Navigation -->
	<div class="tabNav">
		<button
			class="tabButton"
			class:active={activeTab === 'announcement'}
			onclick={() => (activeTab = 'announcement')}
		>
			📢 Announce Update
		</button>
		<button
			class="tabButton"
			class:active={activeTab === 'compose'}
			onclick={() => (activeTab = 'compose')}
		>
			✉️ Compose Email
		</button>
	</div>

	<!-- Announcement Tab -->
	{#if activeTab === 'announcement'}
		<div class="tabContent">
			<div class="composeGrid">
				<div class="card">
					<h3>Send Update Announcement</h3>
					<p class="cardDescription">Notify sponsors about a new update.</p>

					{#if announcementResult}
						<div
							class="resultBanner"
							class:success={announcementResult.success}
							class:error={!announcementResult.success}
						>
							{announcementResult.message}
						</div>
					{/if}

					<div class="formGroup">
						<label for="updateSelect">Select Update to Announce</label>
						<select id="updateSelect" bind:value={selectedUpdateId}>
							<option value="">-- Choose an update --</option>
							{#each data.updates as update (update.id)}
								<option value={update.id}>{update.title}</option>
							{/each}
						</select>
					</div>

					{#if selectedUpdate}
						<div class="formGroup">
							<label for="announcementMessage">Message (optional)</label>
							<p class="fieldHint">Add a personal note that appears before the update details</p>
							<RichTextEditor
								content={announcementMessage}
								onchange={(html) => (announcementMessage = html)}
								placeholder="e.g., Dear sponsors, we're excited to share this update with you..."
							/>
						</div>

						<div class="updatePreview">
							<h4>Update Preview</h4>
							<div class="previewCard">
								<strong>{selectedUpdate.title}</strong>
								{#if selectedUpdate.excerpt}
									<p>{selectedUpdate.excerpt}</p>
								{/if}
								<span class="previewLink">/updates/{selectedUpdate.slug}</span>
							</div>
						</div>
					{/if}

					<button
						class="primaryButton"
						onclick={sendAnnouncement}
						disabled={announcementSending ||
							!selectedUpdateId ||
							(announcementMode === 'select' && announcementRecipients.length === 0)}
					>
						{#if announcementSending}
							Sending...
						{:else}
							Send to {announcementRecipientCount} Recipient{announcementRecipientCount !== 1
								? 's'
								: ''}
						{/if}
					</button>
				</div>

				<!-- Recipient Selection for Announcement -->
				<div class="card recipientsCard">
					<h3>Recipients</h3>

					<div class="modeToggle">
						<button
							class="modeButton"
							class:active={announcementMode === 'subscribed'}
							onclick={() => (announcementMode = 'subscribed')}
						>
							All Subscribed ({subscribedCount})
						</button>
						<button
							class="modeButton"
							class:active={announcementMode === 'select'}
							onclick={() => (announcementMode = 'select')}
						>
							Select Specific
						</button>
					</div>

					{#if announcementMode === 'select'}
						<div class="recipientActions">
							<button class="actionButton" onclick={toggleAnnouncementSelectAll}>
								{announcementAllSelected ? 'Deselect All' : 'Select All'}
							</button>
							<button class="actionButton" onclick={selectAnnouncementSubscribed}>
								Select Subscribed
							</button>
						</div>

						<div class="selectedCount">
							{announcementRecipients.length} of {data.sponsors.length} selected
						</div>

						<div class="recipientList">
							{#each data.sponsors as sponsor (sponsor.id)}
								{@const kidsLabel = sponsoredKidsLabel(sponsor)}
								<label
									class="recipientItem"
									class:selected={announcementRecipients.includes(sponsor.id)}
								>
									<input
										type="checkbox"
										checked={announcementRecipients.includes(sponsor.id)}
										onchange={() => toggleAnnouncementRecipient(sponsor.id)}
									/>
									<div class="recipientInfo">
										<span class="recipientName">{sponsor.firstName} {sponsor.lastName}</span>
										<span class="recipientEmail">{sponsor.email}</span>
										{#if kidsLabel}
											<span class="recipientKids">Sponsoring: {kidsLabel}</span>
										{/if}
									</div>
									{#if sponsor.subscribed}
										<span class="subscribedBadge">Subscribed</span>
									{/if}
								</label>
							{/each}
						</div>
					{:else}
						<p class="modeDescription">
							Email will be sent to all {subscribedCount} sponsors who are subscribed to updates.
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Compose Tab -->
	{#if activeTab === 'compose'}
		<div class="tabContent composeTab">
			<div class="composeGrid">
				<!-- Email Form -->
				<div class="card composeCard">
					<h3>Compose Email</h3>

					{#if composeResult}
						<div
							class="resultBanner"
							class:success={composeResult.success}
							class:error={!composeResult.success}
						>
							{composeResult.message}
						</div>
					{/if}

					<div class="formGroup">
						<label for="subject">Subject</label>
						<input
							type="text"
							id="subject"
							bind:value={composeSubject}
							placeholder="Enter email subject..."
						/>
					</div>

					<div class="formGroup">
						<label for="content">Message</label>
						<RichTextEditor
							content={composeContent}
							onchange={(html) => (composeContent = html)}
							placeholder="Write your message here..."
						/>
					</div>

					<button
						class="primaryButton"
						onclick={sendCustomEmail}
						disabled={composeSending || composeRecipients.length === 0}
					>
						{#if composeSending}
							Sending...
						{:else}
							Send to {composeRecipients.length} Recipient{composeRecipients.length !== 1
								? 's'
								: ''}
						{/if}
					</button>
				</div>

				<!-- Recipient Selection -->
				<div class="card recipientsCard">
					<h3>Select Recipients</h3>

					<div class="recipientActions">
						<button class="actionButton" onclick={toggleComposeSelectAll}>
							{composeAllSelected ? 'Deselect All' : 'Select All'}
						</button>
						<button class="actionButton" onclick={selectComposeSubscribed}>
							Select Subscribed ({subscribedCount})
						</button>
					</div>

					<div class="selectedCount">
						{composeRecipients.length} of {data.sponsors.length} selected
					</div>

					<div class="recipientList">
						{#each data.sponsors as sponsor (sponsor.id)}
							{@const kidsLabel = sponsoredKidsLabel(sponsor)}
							<label class="recipientItem" class:selected={composeRecipients.includes(sponsor.id)}>
								<input
									type="checkbox"
									checked={composeRecipients.includes(sponsor.id)}
									onchange={() => toggleComposeRecipient(sponsor.id)}
								/>
								<div class="recipientInfo">
									<span class="recipientName">{sponsor.firstName} {sponsor.lastName}</span>
									<span class="recipientEmail">{sponsor.email}</span>
									{#if kidsLabel}
										<span class="recipientKids">Sponsoring: {kidsLabel}</span>
									{/if}
								</div>
								{#if sponsor.subscribed}
									<span class="subscribedBadge">Subscribed</span>
								{/if}
							</label>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.adminPage {
		animation: cardsIn var(--transition-base);

		.header {
			margin-bottom: var(--spacing-xl);

			h2 {
				color: var(--primaryColor);
				margin-bottom: var(--spacing-sm);
				font-size: clamp(1.5rem, 3vw, 2rem);
			}

			.subtitle {
				color: var(--textMuted);
			}
		}
	}

	.tabNav {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-xl);
		border-bottom: 2px solid var(--borderColor);
		padding-bottom: var(--spacing-md);
	}

	.tabButton {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: transparent;
		color: var(--textMuted);
		border: none;
		border-radius: var(--radius-md) var(--radius-md) 0 0;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all var(--transition-base);
		position: relative;

		&:hover {
			color: var(--primaryColor);
		}

		&.active {
			color: var(--primaryColor);
			background: var(--surfaceColor);

			&::after {
				content: '';
				position: absolute;
				bottom: calc(-1 * var(--spacing-md) - 2px);
				left: 0;
				right: 0;
				height: 3px;
				background: var(--primaryColor);
				border-radius: 2px 2px 0 0;
			}
		}
	}

	.tabContent {
		animation: fadeIn var(--transition-base);
	}

	.card {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl);
		box-shadow: var(--shadow-sm);

		h3 {
			color: var(--primaryColor);
			margin-bottom: var(--spacing-sm);
		}

		.cardDescription {
			color: var(--textMuted);
			margin-bottom: var(--spacing-lg);
		}
	}

	.formGroup {
		margin-bottom: var(--spacing-lg);

		label {
			display: block;
			font-weight: 600;
			color: var(--textColor);
			margin-bottom: var(--spacing-xs);
		}

		input,
		select,
		textarea {
			width: 100%;
			padding: var(--spacing-sm) var(--spacing-md);
			border: 1px solid var(--borderColor);
			border-radius: var(--radius-md);
			font-size: 1rem;
			background: var(--backgroundColor);
			color: var(--textColor);
			transition: border-color var(--transition-fast);

			&:focus {
				outline: none;
				border-color: var(--primaryColor);
			}
		}

		.fieldHint {
			color: var(--textMuted);
			font-size: 0.875rem;
			margin: var(--spacing-xs) 0 var(--spacing-sm);
		}
	}

	.updatePreview {
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--backgroundColor);
		border-radius: var(--radius-md);
		border: 1px dashed var(--borderColor);

		h4 {
			color: var(--textMuted);
			font-size: 0.875rem;
			margin-bottom: var(--spacing-sm);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.previewCard {
			strong {
				display: block;
				color: var(--primaryColor);
				margin-bottom: var(--spacing-xs);
			}

			p {
				color: var(--textMuted);
				font-size: 0.875rem;
				margin-bottom: var(--spacing-xs);
			}

			.previewLink {
				font-family: monospace;
				font-size: 0.75rem;
				color: var(--textMuted);
				background: var(--surfaceColor);
				padding: var(--spacing-xs) var(--spacing-sm);
				border-radius: var(--radius-sm);
			}
		}
	}

	.primaryButton {
		background: var(--primaryColor);
		color: var(--contrastColor);
		padding: var(--spacing-sm) var(--spacing-xl);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all var(--transition-base);

		&:hover:not(:disabled) {
			opacity: 0.9;
			transform: translateY(-2px);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.resultBanner {
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-lg);
		font-weight: 500;

		&.success {
			background: oklch(0.9 0.1 145);
			color: oklch(0.35 0.15 145);
		}

		&.error {
			background: oklch(0.95 0.05 20);
			color: oklch(0.4 0.15 20);
		}
	}

	/* Compose Tab Styles */
	.composeGrid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: var(--spacing-xl);
		align-items: start;

		@media (max-width: 1024px) {
			grid-template-columns: 1fr;
		}
	}

	.recipientsCard {
		position: sticky;
		top: var(--spacing-lg);
	}

	.modeToggle {
		display: flex;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-lg);
		background: var(--backgroundColor);
		padding: var(--spacing-xs);
		border-radius: var(--radius-md);
	}

	.modeButton {
		flex: 1;
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		color: var(--textMuted);
		border: none;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--transition-base);

		&:hover {
			color: var(--textColor);
		}

		&.active {
			background: var(--primaryColor);
			color: var(--contrastColor);
		}
	}

	.modeDescription {
		color: var(--textMuted);
		font-size: 0.875rem;
		line-height: 1.6;
		padding: var(--spacing-md);
		background: var(--backgroundColor);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.recipientActions {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		flex-wrap: wrap;
	}

	.actionButton {
		padding: var(--spacing-xs) var(--spacing-md);
		background: var(--backgroundColor);
		color: var(--primaryColor);
		border: 1px solid var(--primaryColor);
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all var(--transition-base);

		&:hover {
			background: var(--primaryColor);
			color: var(--contrastColor);
		}
	}

	.selectedCount {
		color: var(--textMuted);
		font-size: 0.875rem;
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-md);
		border-bottom: 1px solid var(--borderColor);
	}

	.recipientList {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		max-height: 400px;
		overflow-y: auto;
	}

	.recipientItem {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--backgroundColor);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
		border: 2px solid transparent;

		&:hover {
			border-color: var(--borderColor);
		}

		&.selected {
			border-color: var(--primaryColor);
			background: oklch(from var(--primaryColor) l c h / 0.1);
		}

		input[type='checkbox'] {
			width: 1.25rem;
			height: 1.25rem;
			flex-shrink: 0;
		}

		.recipientInfo {
			flex: 1;
			min-width: 0;

			.recipientName {
				display: block;
				font-weight: 600;
				color: var(--textColor);
				font-size: 0.875rem;
			}

			.recipientEmail {
				display: block;
				color: var(--textMuted);
				font-size: 0.75rem;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.recipientKids {
				display: block;
				color: var(--primaryColor);
				font-size: 0.6875rem;
				font-weight: 600;
				margin-top: var(--spacing-xs);
				line-height: 1.3;
			}
		}

		.subscribedBadge {
			padding: var(--spacing-xs) var(--spacing-sm);
			background: oklch(0.9 0.1 145);
			color: oklch(0.35 0.15 145);
			font-size: 0.625rem;
			font-weight: 700;
			border-radius: var(--radius-sm);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			flex-shrink: 0;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
