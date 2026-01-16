<script lang="ts">
	import type { SponsorWithKids, Kid } from '$lib/server/sponsors';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();

	let sponsors = $state<SponsorWithKids[]>(data.sponsors);
	let allKids = $state<Kid[]>(data.kids);
	let editingSponsor = $state<SponsorWithKids | null>(null);
	let isCreating = $state(false);
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let errorMessage = $state<string | null>(null);
	let showDetails = $state(false);

	let formData = $state({
		firstName: '',
		lastName: '',
		phoneNumber: '',
		email: '',
		sponsorshipType: 'individual',
		subscribed: true,
		kidIds: [] as string[]
	});

	// Keep local state in sync with server data
	$effect(() => {
		sponsors = data.sponsors;
		allKids = data.kids;
	});

	async function refreshData() {
		await invalidateAll();
	}

	function startCreating() {
		isCreating = true;
		editingSponsor = null;
		formData = {
			firstName: '',
			lastName: '',
			phoneNumber: '',
			email: '',
			sponsorshipType: 'individual',
			subscribed: true,
			kidIds: []
		};
	}

	function startEditing(sponsor: SponsorWithKids) {
		isCreating = false;
		editingSponsor = sponsor;
		formData = {
			firstName: sponsor.firstName,
			lastName: sponsor.lastName,
			phoneNumber: sponsor.phoneNumber,
			email: sponsor.email,
			sponsorshipType: sponsor.sponsorshipType,
			subscribed: sponsor.subscribed,
			kidIds: sponsor.kids.map((k) => k.id)
		};
	}

	function cancelForm() {
		isCreating = false;
		editingSponsor = null;
		formData = {
			firstName: '',
			lastName: '',
			phoneNumber: '',
			email: '',
			sponsorshipType: 'individual',
			subscribed: true,
			kidIds: []
		};
	}

	async function saveSponsor() {
		errorMessage = null;
		try {
			const url = editingSponsor ? `/api/sponsors/${editingSponsor.id}` : '/api/sponsors';
			const method = editingSponsor ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				await refreshData();
				cancelForm();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to save sponsor';
			}
		} catch (error) {
			console.error('Error saving sponsor:', error);
			errorMessage = 'An error occurred while saving';
		}
	}

	async function deleteSponsor(id: string) {
		if (!confirm('Are you sure you want to delete this sponsor?')) return;

		errorMessage = null;
		try {
			const response = await fetch(`/api/sponsors/${id}`, { method: 'DELETE' });
			if (response.ok) {
				await refreshData();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to delete sponsor';
			}
		} catch (error) {
			console.error('Error deleting sponsor:', error);
			errorMessage = 'An error occurred while deleting';
		}
	}

	function toggleKid(kidId: string) {
		if (formData.kidIds.includes(kidId)) {
			formData.kidIds = formData.kidIds.filter((id) => id !== kidId);
		} else {
			formData.kidIds = [...formData.kidIds, kidId];
		}
	}

	function sortBy(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	const sortedKids = $derived(() => {
		return [...allKids].sort((a, b) => a.name.localeCompare(b.name));
	});

	const sortedSponsors = $derived(() => {
		if (!sortColumn) return sponsors;

		return [...sponsors].sort((a, b) => {
			let aValue: string | number;
			let bValue: string | number;

			switch (sortColumn) {
				case 'name':
					aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
					bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
					break;
				case 'type':
					aValue = a.sponsorshipType.toLowerCase();
					bValue = b.sponsorshipType.toLowerCase();
					break;
				case 'email':
					aValue = a.email.toLowerCase();
					bValue = b.email.toLowerCase();
					break;
				case 'phone':
					aValue = a.phoneNumber;
					bValue = b.phoneNumber;
					break;
				case 'kids':
					aValue = a.kids.length;
					bValue = b.kids.length;
					break;
				default:
					return 0;
			}

			if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	});
</script>

<div class="adminPage">
	<div class="header">
		<div>
			<h2>Sponsors Management</h2>
			<p class="subtitle">Manage sponsor information and relationships</p>
		</div>
		<button class="primaryButton" onclick={startCreating}>+ Add Sponsor</button>
	</div>

	{#if errorMessage}
		<div class="errorBanner" role="alert">
			<p>{errorMessage}</p>
			<button onclick={() => (errorMessage = null)} class="dismissButton">Dismiss</button>
		</div>
	{/if}

	{#if sponsors.length > 0}
		<div class="tableControls">
			<button class="toggleDetailsBtn" onclick={() => (showDetails = !showDetails)}>
				{showDetails ? 'Hide Details' : 'Show Details'}
			</button>
		</div>
		<div class="tableContainer">
			<table class="sponsorsTable">
				<thead>
					<tr>
						<th class="sortable" onclick={() => sortBy('name')}>
							Name
							<span class="sortIndicator">
								{#if sortColumn === 'name'}
									{sortDirection === 'asc' ? '↑' : '↓'}
								{/if}
							</span>
						</th>
						{#if showDetails}
							<th class="sortable" onclick={() => sortBy('type')}>
								Type
								<span class="sortIndicator">
									{#if sortColumn === 'type'}
										{sortDirection === 'asc' ? '↑' : '↓'}
									{/if}
								</span>
							</th>
							<th class="sortable" onclick={() => sortBy('email')}>
								Email
								<span class="sortIndicator">
									{#if sortColumn === 'email'}
										{sortDirection === 'asc' ? '↑' : '↓'}
									{/if}
								</span>
							</th>
							<th class="sortable" onclick={() => sortBy('phone')}>
								Phone
								<span class="sortIndicator">
									{#if sortColumn === 'phone'}
										{sortDirection === 'asc' ? '↑' : '↓'}
									{/if}
								</span>
							</th>
							<th>Subscribed</th>
						{/if}
						<th class="sortable" onclick={() => sortBy('kids')}>
							Sponsored Kids
							<span class="sortIndicator">
								{#if sortColumn === 'kids'}
									{sortDirection === 'asc' ? '↑' : '↓'}
								{/if}
							</span>
						</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each sortedSponsors() as sponsor (sponsor.id)}
						<tr>
							<td class="nameCell">
								<div class="sponsorName">{sponsor.firstName} {sponsor.lastName}</div>
							</td>
							{#if showDetails}
								<td class="typeCell">
									<span class="sponsorshipType">{sponsor.sponsorshipType}</span>
								</td>
								<td class="emailCell">{sponsor.email}</td>
								<td class="phoneCell">{sponsor.phoneNumber}</td>
								<td class="subscribedCell">
									<span class="subscribedBadge" class:subscribed={sponsor.subscribed}>
										{sponsor.subscribed ? 'Yes' : 'No'}
									</span>
								</td>
							{/if}
							<td class="kidsCell">
								{#if sponsor.kids.length > 0}
									<div class="kidsList">
										{#each sponsor.kids as kid}
											<span class="kidBadge">{kid.name}</span>
										{/each}
									</div>
								{:else}
									<span class="noKids">None</span>
								{/if}
							</td>
							<td class="actionsCell">
								<div class="tableActions">
									<button class="editButton" onclick={() => startEditing(sponsor)}>Edit</button>
									<button class="deleteButton" onclick={() => deleteSponsor(sponsor.id)}
										>Delete</button
									>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="emptyState">
			<p>No sponsors yet. Click "Add Sponsor" to create one.</p>
		</div>
	{/if}
</div>

<!-- Sidebar Overlay -->
{#if isCreating || editingSponsor}
	<div
		class="sidebarOverlay"
		onclick={cancelForm}
		onkeydown={(e) => e.key === 'Escape' && cancelForm()}
		role="button"
		tabindex="-1"
	></div>
	<aside class="sidebar">
		<div class="sidebarHeader">
			<h3>{editingSponsor ? 'Edit Sponsor' : 'Add New Sponsor'}</h3>
			<button class="closeButton" onclick={cancelForm} aria-label="Close sidebar">✕</button>
		</div>

		<div class="sidebarContent">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveSponsor();
				}}
			>
				<div class="formGroup">
					<label for="firstName">First Name</label>
					<input type="text" id="firstName" bind:value={formData.firstName} required />
				</div>

				<div class="formGroup">
					<label for="lastName">Last Name</label>
					<input type="text" id="lastName" bind:value={formData.lastName} required />
				</div>

				<div class="formGroup">
					<label for="phoneNumber">Phone Number</label>
					<input type="tel" id="phoneNumber" bind:value={formData.phoneNumber} required />
				</div>

				<div class="formGroup">
					<label for="email">Email Address</label>
					<input type="email" id="email" bind:value={formData.email} required />
				</div>

				<div class="formGroup">
					<label for="sponsorshipType">Sponsorship Type</label>
					<select id="sponsorshipType" bind:value={formData.sponsorshipType} required>
						<option value="individual">Individual</option>
						<option value="family">Family</option>
						<option value="group">Group</option>
					</select>
				</div>

				<div class="formGroup checkboxGroup">
					<label class="checkboxLabel">
						<input type="checkbox" bind:checked={formData.subscribed} />
						<span>Subscribed to updates</span>
					</label>
				</div>

				<div class="formGroup">
					<div class="fieldLabel">Sponsored Kids</div>
					<div class="kidsGrid">
						{#each sortedKids() as kid}
							<label class="kidCheckbox">
								<input
									type="checkbox"
									checked={formData.kidIds.includes(kid.id)}
									onchange={() => toggleKid(kid.id)}
								/>
								<span>{kid.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="formActions">
					<button type="submit" class="primaryButton">Save</button>
					<button type="button" class="secondaryButton" onclick={cancelForm}>Cancel</button>
				</div>
			</form>
		</div>
	</aside>
{/if}

<style>
	.adminPage {
		animation: cardsIn var(--transition-base);

		.header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: var(--spacing-xl);
			gap: var(--spacing-lg);
			flex-wrap: wrap;

			h2 {
				color: var(--primaryColor);
				margin-bottom: var(--spacing-sm);
				font-size: clamp(1.5rem, 3vw, 2rem);
			}

			.subtitle {
				color: var(--textMuted);
			}
		}

		.primaryButton {
			background: var(--primaryColor);
			color: var(--contrastColor);
			padding: var(--spacing-sm) var(--spacing-lg);
			border: none;
			border-radius: var(--radius-md);
			font-weight: 600;
			cursor: pointer;
			transition: all var(--transition-base);

			&:hover {
				opacity: 0.9;
				transform: translateY(-2px);
			}
		}

		.tableControls {
			display: flex;
			justify-content: flex-end;
			margin-bottom: var(--spacing-md);
		}

		.toggleDetailsBtn {
			padding: var(--spacing-xs) var(--spacing-md);
			background: var(--surfaceColor);
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

		.tableContainer {
			background: var(--surfaceColor);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-sm);
			overflow: hidden;

			.sponsorsTable {
				width: 100%;
				border-collapse: collapse;
				font-size: 0.875rem;

				thead {
					background: var(--backgroundColor);
				}

				th {
					padding: var(--spacing-md) var(--spacing-lg);
					text-align: left;
					font-weight: 600;
					color: var(--textColor);
					border-bottom: 2px solid var(--borderColor, #e5e7eb);
					position: relative;

					&.sortable {
						cursor: pointer;
						user-select: none;
						transition: background-color var(--transition-base);

						&:hover {
							background: var(--primaryColor);
							color: var(--contrastColor);
						}
					}
				}

				td {
					padding: var(--spacing-md) var(--spacing-lg);
					border-bottom: 1px solid var(--borderColor, #e5e7eb);
					vertical-align: top;

					&.emailCell,
					&.phoneCell {
						color: var(--textMuted);
						font-family: monospace;
						font-size: 0.8rem;
					}
				}

				tbody tr:hover {
					background: var(--backgroundColor);
				}
			}
		}

		.sortIndicator {
			margin-left: var(--spacing-xs);
			font-size: 0.75rem;
			opacity: 0.7;
		}

		.sponsorName {
			font-weight: 600;
			color: var(--primaryColor);
		}

		.sponsorshipType {
			display: inline-block;
			background: var(--backgroundColor);
			color: var(--primaryColor);
			padding: var(--spacing-xs) var(--spacing-sm);
			border-radius: var(--radius-sm);
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: capitalize;
		}

		.kidsList {
			display: flex;
			flex-wrap: wrap;
			gap: var(--spacing-xs);

			.kidBadge {
				background: var(--primaryColor);
				color: var(--contrastColor);
				padding: var(--spacing-xs) var(--spacing-sm);
				border-radius: var(--radius-sm);
				font-size: 0.75rem;
				white-space: nowrap;
			}
		}

		.noKids {
			color: var(--textMuted);
			font-style: italic;
			font-size: 0.8rem;
		}

		.subscribedBadge {
			display: inline-block;
			padding: var(--spacing-xs) var(--spacing-sm);
			border-radius: var(--radius-sm);
			font-size: 0.75rem;
			font-weight: 600;
			background: oklch(0.9 0.05 20);
			color: oklch(0.4 0.15 20);

			&.subscribed {
				background: oklch(0.9 0.1 145);
				color: oklch(0.35 0.15 145);
			}
		}

		.tableActions {
			display: flex;
			gap: var(--spacing-xs);

			.editButton,
			.deleteButton {
				padding: var(--spacing-xs) var(--spacing-sm);
				border: none;
				border-radius: var(--radius-sm);
				cursor: pointer;
				font-weight: 600;
				font-size: 0.75rem;
				transition: all var(--transition-base);

				&:hover {
					opacity: 0.8;
					transform: translateY(-1px);
				}
			}

			.editButton {
				background: var(--primaryColor);
				color: var(--contrastColor);
			}

			.deleteButton {
				background: transparent;
				color: #dc2626;
				border: 1px solid #dc2626;
			}
		}

		.emptyState {
			text-align: center;
			color: var(--textMuted);
			padding: var(--spacing-2xl);
			background: var(--surfaceColor);
			border-radius: var(--radius-lg);
		}

		.errorBanner {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: var(--spacing-md) var(--spacing-lg);
			background: oklch(0.95 0.05 20);
			color: oklch(0.4 0.15 20);
			border: 1px solid oklch(0.8 0.08 20);
			border-radius: var(--radius-md);
			margin-bottom: var(--spacing-lg);

			p {
				margin: 0;
			}

			.dismissButton {
				background: transparent;
				border: 1px solid currentColor;
				color: inherit;
				padding: var(--spacing-xs) var(--spacing-sm);
				border-radius: var(--radius-sm);
				cursor: pointer;
				font-size: 0.875rem;

				&:hover {
					background: oklch(0.4 0.15 20);
					color: white;
				}
			}
		}

		/* Responsive table */
		@media (max-width: 768px) {
			.tableContainer {
				overflow-x: auto;

				.sponsorsTable {
					min-width: 600px;

					th,
					td {
						padding: var(--spacing-sm);
					}
				}
			}

			.tableActions {
				flex-direction: column;
			}
		}
	}

	/* Sidebar Styles */
	.sidebarOverlay {
		position: fixed;
		inset: 0;
		background: oklch(0 0 0 / 0.5);
		z-index: 100;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.sidebar {
		position: fixed;
		top: 0;
		right: 0;
		width: min(450px, 90vw);
		height: 100vh;
		background: var(--surfaceColor);
		box-shadow: var(--shadow-lg, -4px 0 20px oklch(0 0 0 / 0.15));
		z-index: 101;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.sidebarHeader {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--borderColor, #ddd);
		background: var(--backgroundColor);

		h3 {
			color: var(--primaryColor);
			margin: 0;
		}
	}

	.closeButton {
		background: transparent;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--textMuted);
		padding: var(--spacing-xs);
		line-height: 1;
		transition: color var(--transition-base);

		&:hover {
			color: var(--primaryColor);
		}
	}

	.sidebarContent {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);

		.formGroup {
			display: flex;
			flex-direction: column;
			gap: var(--spacing-xs);
			margin-bottom: var(--spacing-lg);

			label,
			.fieldLabel {
				font-weight: 600;
				color: var(--textColor);
			}

			input,
			select {
				padding: var(--spacing-sm);
				border: 1px solid var(--borderColor, #ddd);
				border-radius: var(--radius-md);
				font-size: 1rem;
				background: var(--backgroundColor);
				color: var(--textColor);
			}

			&.checkboxGroup {
				.checkboxLabel {
					display: flex;
					align-items: center;
					gap: var(--spacing-sm);
					cursor: pointer;

					input[type='checkbox'] {
						width: 1.25rem;
						height: 1.25rem;
						padding: 0;
					}

					span {
						font-weight: normal;
					}
				}
			}
		}

		.kidsGrid {
			display: flex;
			flex-direction: column;
			gap: var(--spacing-sm);
			padding: var(--spacing-md);
			background: var(--backgroundColor);
			border-radius: var(--radius-md);
			max-height: 250px;
			overflow-y: auto;

			.kidCheckbox {
				display: flex;
				align-items: center;
				gap: var(--spacing-xs);
				cursor: pointer;
			}
		}

		.formActions {
			display: flex;
			gap: var(--spacing-md);
			margin-top: var(--spacing-lg);
			padding-top: var(--spacing-lg);
			border-top: 1px solid var(--borderColor, #ddd);
			position: sticky;
			bottom: 0;
			background: var(--surfaceColor);
		}

		.primaryButton {
			background: var(--primaryColor);
			color: var(--contrastColor);
			padding: var(--spacing-sm) var(--spacing-lg);
			border: none;
			border-radius: var(--radius-md);
			font-weight: 600;
			cursor: pointer;
			transition: all var(--transition-base);

			&:hover {
				opacity: 0.9;
			}
		}

		.secondaryButton {
			background: transparent;
			color: var(--textColor);
			padding: var(--spacing-sm) var(--spacing-lg);
			border: 1px solid var(--borderColor, #ddd);
			border-radius: var(--radius-md);
			font-weight: 600;
			cursor: pointer;
			transition: all var(--transition-base);

			&:hover {
				background: var(--backgroundColor);
			}
		}
	}
</style>
