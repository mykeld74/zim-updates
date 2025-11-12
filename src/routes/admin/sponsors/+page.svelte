<script lang="ts">
	import type { SponsorWithKids, Kid } from '$lib/server/sponsors';

	let sponsors = $state<SponsorWithKids[]>([]);
	let allKids = $state<Kid[]>([]);
	let loading = $state(true);
	let editingSponsor = $state<SponsorWithKids | null>(null);
	let isCreating = $state(false);
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	let formData = $state({
		firstName: '',
		lastName: '',
		phoneNumber: '',
		email: '',
		sponsorshipType: 'individual',
		kidIds: [] as string[]
	});

	async function loadSponsors() {
		try {
			const response = await fetch('/api/sponsors');
			if (response.ok) {
				const data = await response.json();
				sponsors = data.sponsors;
			}
		} catch (error) {
			console.error('Error loading sponsors:', error);
		} finally {
			loading = false;
		}
	}

	async function loadKids() {
		try {
			const response = await fetch('/api/kids');
			if (response.ok) {
				const data = await response.json();
				allKids = data.kids;
			}
		} catch (error) {
			console.error('Error loading kids:', error);
		}
	}

	function smoothScrollTo(element: Element) {
		const startPosition = window.pageYOffset;
		const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - 20; // 20px offset
		const distance = targetPosition - startPosition;
		const duration = 800; // 800ms duration
		let start: number | null = null;

		function animation(currentTime: number) {
			if (start === null) start = currentTime;
			const timeElapsed = currentTime - start;
			const progress = Math.min(timeElapsed / duration, 1);

			// Easing function for smooth animation
			const ease =
				progress < 0.5
					? 4 * progress * progress * progress
					: 1 - Math.pow(-2 * progress + 2, 3) / 2;

			window.scrollTo(0, startPosition + distance * ease);

			if (timeElapsed < duration) {
				requestAnimationFrame(animation);
			}
		}

		requestAnimationFrame(animation);
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
			kidIds: []
		};

		// Scroll to form and focus first input
		setTimeout(() => {
			const formCard = document.querySelector('.formCard');
			if (formCard) {
				smoothScrollTo(formCard);
				const firstInput = formCard.querySelector('input') as HTMLInputElement;
				if (firstInput) {
					firstInput.focus();
				}
			}
		}, 150);
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
			kidIds: sponsor.kids.map((k) => k.id)
		};

		// Scroll to form and focus first input
		setTimeout(() => {
			const formCard = document.querySelector('.formCard');
			if (formCard) {
				smoothScrollTo(formCard);
				const firstInput = formCard.querySelector('input') as HTMLInputElement;
				if (firstInput) {
					firstInput.focus();
				}
			}
		}, 150);
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
			kidIds: []
		};
	}

	async function saveSponsor() {
		try {
			const url = editingSponsor ? `/api/sponsors/${editingSponsor.id}` : '/api/sponsors';
			const method = editingSponsor ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				await loadSponsors();
				cancelForm();
			}
		} catch (error) {
			console.error('Error saving sponsor:', error);
		}
	}

	async function deleteSponsor(id: string) {
		if (!confirm('Are you sure you want to delete this sponsor?')) return;

		try {
			const response = await fetch(`/api/sponsors/${id}`, { method: 'DELETE' });
			if (response.ok) {
				await loadSponsors();
			}
		} catch (error) {
			console.error('Error deleting sponsor:', error);
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

	$effect(() => {
		loadSponsors();
		loadKids();
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

	{#if isCreating || editingSponsor}
		<div class="formCard">
			<h3>{editingSponsor ? 'Edit Sponsor' : 'Create New Sponsor'}</h3>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveSponsor();
				}}
			>
				<div class="formGrid">
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
				</div>

				<div class="formGroup">
					<div class="fieldLabel">Sponsored Kids</div>
					<div class="kidsGrid">
						{#each allKids as kid}
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
	{/if}

	{#if loading}
		<p class="loadingText">Loading sponsors...</p>
	{:else if sponsors.length > 0}
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
							<td class="typeCell">
								<span class="sponsorshipType">{sponsor.sponsorshipType}</span>
							</td>
							<td class="emailCell">{sponsor.email}</td>
							<td class="phoneCell">{sponsor.phoneNumber}</td>
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

<style>
	.adminPage {
		animation: cardsIn var(--transition-base);
		scroll-behavior: smooth;

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

		.formCard {
			background: var(--surfaceColor);
			padding: var(--spacing-xl);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-sm);
			margin-bottom: var(--spacing-xl);
			transition: all var(--transition-base);
			transform: translateY(0);

			h3 {
				color: var(--primaryColor);
				margin-bottom: var(--spacing-lg);
			}

			.formGrid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
				gap: var(--spacing-lg);
				margin-bottom: var(--spacing-lg);
			}

			.formGroup {
				display: flex;
				flex-direction: column;
				gap: var(--spacing-xs);

				label {
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
			}

			.fieldLabel {
				font-weight: 600;
				color: var(--textColor);
			}

			.kidsGrid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
				gap: var(--spacing-sm);
				padding: var(--spacing-md);
				background: var(--backgroundColor);
				border-radius: var(--radius-md);

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
				background: var(--surfaceColor);
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

		.loadingText,
		.emptyState {
			text-align: center;
			color: var(--textMuted);
			padding: var(--spacing-2xl);
			background: var(--surfaceColor);
			border-radius: var(--radius-lg);
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
</style>
