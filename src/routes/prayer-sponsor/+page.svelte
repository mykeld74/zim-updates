<script lang="ts">
	import { AdminImage, formatKidDisplayName } from '$lib';

	const { data } = $props();
	type KidProfile = (typeof data.kids)[number];

	let formData = $state({
		firstName: '',
		lastName: '',
		email: '',
		phoneNumber: '',
		kidId: '',
		subscribed: true
	});

	let submitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let selectedKid = $state<KidProfile | null>(null);

	function openKidModal(kid: KidProfile) {
		selectedKid = kid;
	}

	function closeKidModal() {
		selectedKid = null;
	}

	async function submitSponsorForm() {
		errorMessage = '';
		successMessage = '';
		submitting = true;

		try {
			const response = await fetch('/api/prayer-sponsors', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			const result = await response.json();
			if (!response.ok) {
				errorMessage = result.error || 'Unable to submit your sponsorship right now.';
				return;
			}

			successMessage =
				'Thank you for signing up! We have received your prayer sponsorship request.';
			formData = {
				firstName: '',
				lastName: '',
				email: '',
				phoneNumber: '',
				kidId: '',
				subscribed: true
			};
		} catch {
			errorMessage = 'Something went wrong while submitting. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Prayer Sponsor Signup - Zim Updates</title>
	<meta
		name="description"
		content="Sign up to become a prayer sponsor and support one of our kids in Zimbabwe."
	/>
</svelte:head>

<section class="page">
	<div class="header">
		<h1>Become a Prayer Sponsor</h1>
		<p>Pick one child to pray for and stay connected with updates from our ministry.</p>
	</div>

	{#if errorMessage}
		<p class="message error" role="alert">{errorMessage}</p>
	{/if}

	{#if successMessage}
		<p class="message success" role="status">{successMessage}</p>
	{/if}

	<form
		class="sponsorForm"
		onsubmit={(event) => {
			event.preventDefault();
			submitSponsorForm();
		}}
	>
		<label>
			First Name
			<input type="text" bind:value={formData.firstName} required />
		</label>

		<label>
			Last Name
			<input type="text" bind:value={formData.lastName} required />
		</label>

		<label>
			Email
			<input type="email" bind:value={formData.email} required />
		</label>

		<label>
			Phone Number
			<input type="tel" bind:value={formData.phoneNumber} required />
		</label>

		<label>
			Choose a Child to Sponsor in Prayer
			<select bind:value={formData.kidId} required>
				<option value="">Select a child</option>
				{#each data.kids as kid (kid.id)}
					<option value={kid.id}>{formatKidDisplayName(kid.name, kid.nickname)}</option>
				{/each}
			</select>
		</label>

		<label class="checkboxLabel">
			<input type="checkbox" bind:checked={formData.subscribed} />
			Send me future update emails
		</label>

		<button type="submit" disabled={submitting}>
			{submitting ? 'Submitting...' : 'Submit Prayer Sponsorship'}
		</button>
	</form>

	<div class="kidsGrid">
		{#each data.kids as kid (kid.id)}
			<button type="button" class="kidCardButton" onclick={() => openKidModal(kid)}>
				<article class="kidCard">
					{#if kid.featuredImage || kid.image}
						<div class="kidAvatar">
							<AdminImage
								source={(kid.featuredImage ?? kid.image)!}
								altTag={formatKidDisplayName(kid.name, kid.nickname)}
								width="160"
								height="160"
								faceCrop={true}
							/>
						</div>
					{/if}
					<div class="kidBody">
						<h2>{formatKidDisplayName(kid.name, kid.nickname)}</h2>
						{#if kid.tagline}
							<p class="kidTagline">{kid.tagline}</p>
						{/if}
						<p class="viewProfile">View full profile</p>
					</div>
				</article>
			</button>
		{/each}
	</div>
</section>

{#if selectedKid}
	{@const kid = selectedKid}
	<div
		class="modalOverlay"
		role="button"
		tabindex="-1"
		aria-label="Close kid profile"
		onclick={closeKidModal}
		onkeydown={(event) => event.key === 'Escape' && closeKidModal()}
	></div>
	<dialog class="kidModal" open>
		<div class="modalHeader">
			<h2>{formatKidDisplayName(kid.name, kid.nickname)}</h2>
			<button type="button" class="closeModalButton" onclick={closeKidModal}>Close</button>
		</div>

		{#if kid.featuredImage || kid.image}
			<div class="modalFeaturedImage">
				<AdminImage
					source={(kid.featuredImage ?? kid.image)!}
					altTag={formatKidDisplayName(kid.name, kid.nickname)}
					width="760"
				/>
			</div>
		{/if}

		<div class="modalMeta">
			{#if kid.tagline}
				<p><strong>Tagline:</strong> <em>{kid.tagline}</em></p>
			{/if}
			{#if kid.birthday}
				<p><strong>Birthday:</strong> {new Date(kid.birthday).toLocaleDateString()}</p>
			{/if}
			{#if kid.gender}
				<p><strong>Gender:</strong> {kid.gender}</p>
			{/if}
		</div>

		{#if kid.description}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div class="modalDescription">{@html kid.description}</div>
		{/if}

		{#if kid.images && kid.images.length > 1}
			<div class="modalGallery">
				<h3>More Photos</h3>
				<div class="galleryGrid">
					{#each kid.images as image (image)}
						<AdminImage
							source={image}
							altTag={`${formatKidDisplayName(kid.name, kid.nickname)} additional photo`}
							width="220"
						/>
					{/each}
				</div>
			</div>
		{/if}

		<div class="modalActions">
			<button
				type="button"
				class="chooseKidButton"
				onclick={() => {
					formData.kidId = kid.id;
					closeKidModal();
				}}
			>
				Sponsor {formatKidDisplayName(kid.name, kid.nickname)}
			</button>
		</div>
	</dialog>
{/if}

<style>
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--spacing-2xl) var(--spacing-lg);
		display: grid;
		gap: var(--spacing-xl);
	}

	.header h1 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
	}

	.sponsorForm {
		display: grid;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
	}

	label {
		display: grid;
		gap: var(--spacing-xs);
		font-weight: 600;
	}

	input,
	select {
		padding: var(--spacing-sm);
		border-radius: var(--radius-md);
		border: 1px solid var(--borderColor);
		background: var(--backgroundColor);
		color: var(--textColor);
	}

	.checkboxLabel {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-weight: 500;
	}

	button {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		background: var(--primaryColor);
		color: var(--contrastColor);
		font-weight: 600;
		cursor: pointer;
	}

	.message {
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
	}

	.message.error {
		background: oklch(0.95 0.05 20);
		color: oklch(0.4 0.15 20);
	}

	.message.success {
		background: oklch(0.94 0.08 150);
		color: oklch(0.42 0.12 150);
	}

	.kidsGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: var(--spacing-lg);
	}

	.kidCardButton {
		background: transparent;
		padding: 0;
	}

	.kidCard {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		transition: transform var(--transition-base);
		padding: var(--spacing-sm);
		display: grid;
		justify-items: center;
		gap: var(--spacing-xs);
	}

	.kidCardButton:hover .kidCard {
		transform: translateY(-4px);
	}

	.kidAvatar {
		width: 92px;
		height: 92px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid oklch(from var(--primaryColor) l c h / 0.35);
		box-shadow: var(--shadow-sm);
	}

	.kidAvatar :global(.adminImage) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.kidBody {
		padding: var(--spacing-sm) var(--spacing-md);
		display: grid;
		gap: var(--spacing-xs);
		justify-items: center;
		text-align: center;
	}

	.kidBody h2 {
		color: var(--primaryColor);
		font-size: 1rem;
		margin: 0;
	}

	.viewProfile {
		margin: 0;
		color: var(--textMuted);
		font-size: 0.85rem;
	}

	.kidTagline {
		margin: 0;
		color: var(--textMuted);
		font-size: 0.85rem;
	}

	.modalOverlay {
		position: fixed;
		inset: 0;
		background: oklch(0 0 0 / 0.55);
		z-index: 1000;
	}

	.kidModal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border: none;
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		width: min(840px, calc(100vw - 2rem));
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		background: var(--surfaceColor);
		color: var(--textColor);
		z-index: 1001;
	}

	.modalHeader {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.modalFeaturedImage {
		margin-bottom: var(--spacing-md);
		width: 100%;
		max-width: 250px;
	}

	.modalMeta p {
		margin: 0 0 var(--spacing-md);
	}

	.modalDescription {
		line-height: 1.5;
	}

	.modalGallery h3 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
	}

	.galleryGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: var(--spacing-sm);
	}

	.modalActions {
		margin-top: var(--spacing-lg);
		display: flex;
		justify-content: flex-end;
	}

	.closeModalButton {
		background: transparent;
		color: var(--textColor);
		border: 1px solid var(--borderColor);
	}

	.chooseKidButton {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}
</style>
