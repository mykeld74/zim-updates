<script lang="ts">
	import { resolveRoute } from '$app/paths';
	import { AdminImage, formatKidDisplayName } from '$lib';
	import { fade, scale, slide } from 'svelte/transition';

	const { data } = $props();
	type KidProfile = (typeof data.kids)[number];
	function splitDisplayName(name: string | null | undefined) {
		const trimmed = (name ?? '').trim();
		if (!trimmed) return { firstName: '', lastName: '' };
		const parts = trimmed.split(/\s+/);
		return {
			firstName: parts[0] ?? '',
			lastName: parts.length > 1 ? parts.slice(1).join(' ') : ''
		};
	}

	function createInitialFormData() {
		const prefills = splitDisplayName(data.user?.name);
		return {
			firstName: prefills.firstName,
			lastName: prefills.lastName,
			email: data.user?.email ?? '',
			phoneNumber: data.matchedSponsorPhoneNumber ?? '',
			password: '',
			confirmPassword: '',
			sponsorshipType: 'individual',
			kidId: '',
			subscribed: true
		};
	}

	function maskPhoneNumber(value: string) {
		const digits = value.replace(/\D/g, '').slice(0, 10);
		if (digits.length <= 3) return digits;
		if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
		return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
	}
	const boyKids = $derived(
		data.kids.filter((kid) => ['male', 'boy', 'm'].includes((kid.gender ?? '').toLowerCase()))
	);
	const girlKids = $derived(
		data.kids.filter((kid) => ['female', 'girl', 'f'].includes((kid.gender ?? '').toLowerCase()))
	);

	let formData = $state(createInitialFormData());

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

		if (!data.user) {
			if (!formData.password || !formData.confirmPassword) {
				errorMessage = 'Please add and confirm a password to create your account.';
				return;
			}
			if (formData.password.length < 8) {
				errorMessage = 'Password must be at least 8 characters.';
				return;
			}
			if (formData.password !== formData.confirmPassword) {
				errorMessage = 'Passwords do not match.';
				return;
			}
		}

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
				result.message ||
				'Thank you for signing up! We have received your prayer sponsorship request.';
			formData = createInitialFormData();
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
		{#if !data.user}
			<div class="authCallout">
				<p>Already started your sponsorship journey?</p>
				<div class="authActions">
					<a href={resolveRoute('/login')} class="authLink">Sign in</a>
				</div>
			</div>
		{/if}
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
		<fieldset class="sponsorshipTypeFieldset">
			<legend class="labelHeading">
				Sponsorship Type
				<span class="tooltipWrapper">
					<button
						type="button"
						class="tooltipTrigger"
						aria-label="Learn about sponsorship type options"
						aria-describedby="sponsorshipTypeTip"
					>
						?
					</button>
					<span id="sponsorshipTypeTip" role="tooltip" class="tooltipBubble">
						Are you registering for yourself, your family or a small group
					</span>
				</span>
			</legend>
			<div class="radioGroup" role="radiogroup" aria-label="Sponsorship Type">
				<label class="radioLabel">
					<input type="radio" bind:group={formData.sponsorshipType} value="individual" />
					Individual
				</label>
				<label class="radioLabel">
					<input type="radio" bind:group={formData.sponsorshipType} value="family" />
					Family
				</label>
				<label class="radioLabel">
					<input type="radio" bind:group={formData.sponsorshipType} value="group" />
					Group
				</label>
			</div>
		</fieldset>

		{#if formData.sponsorshipType === 'individual'}
			<label transition:slide={{ duration: 220 }}>
				First Name
				<input type="text" bind:value={formData.firstName} required />
			</label>
		{/if}

		<label>
			{formData.sponsorshipType === 'group'
				? 'Group Name'
				: formData.sponsorshipType === 'family'
					? 'Family Name'
					: 'Last Name'}
			<input type="text" bind:value={formData.lastName} required />
		</label>

		<label>
			Email
			<input type="email" bind:value={formData.email} required />
		</label>

		<label>
			Phone Number
			<input
				type="tel"
				bind:value={formData.phoneNumber}
				required
				inputmode="numeric"
				placeholder="XXX-XXX-XXXX"
				oninput={(event) => {
					const target = event.currentTarget as HTMLInputElement;
					formData.phoneNumber = maskPhoneNumber(target.value);
				}}
			/>
		</label>

		{#if !data.user}
			<label>
				<span class="labelHeading">
					Create Password
					<span class="tooltipWrapper">
						<button
							type="button"
							class="tooltipTrigger"
							aria-label="Learn why to create an account"
							aria-describedby="createPasswordTip"
						>
							?
						</button>
						<span id="createPasswordTip" role="tooltip" class="tooltipBubble">
							By creating an account you can log in to view any updates
						</span>
					</span>
				</span>
				<input
					type="password"
					bind:value={formData.password}
					required
					minlength="8"
					autocomplete="new-password"
				/>
			</label>

			<label>
				Confirm Password
				<input
					type="password"
					bind:value={formData.confirmPassword}
					required
					minlength="8"
					autocomplete="new-password"
				/>
			</label>
		{/if}

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

	<div class="kidsSection">
		<h2 class="kidsSectionTitle">Kids who need prayer sponsors</h2>

		<div class="kidsGroup">
			<h3 class="kidsGroupTitle">Boys</h3>
			<div class="kidsGrid">
				{#each boyKids as kid (kid.id)}
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
		</div>

		<div class="kidsGroup">
			<h3 class="kidsGroupTitle">Girls</h3>
			<div class="kidsGrid">
				{#each girlKids as kid (kid.id)}
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
		</div>
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
		transition:fade={{ duration: 180 }}
	></div>
	<dialog class="kidModal" open transition:scale={{ duration: 220, start: 0.94 }}>
		<div class="modalHeader">
			<h2>{formatKidDisplayName(kid.name, kid.nickname)}</h2>
			<button
				type="button"
				class="closeModalButton"
				aria-label="Close modal"
				onclick={closeKidModal}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true" class="closeIcon">
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
		</div>

		{#if kid.featuredImage || kid.image}
			<div class="modalFeaturedImage">
				<AdminImage
					source={(kid.featuredImage ?? kid.image)!}
					altTag={formatKidDisplayName(kid.name, kid.nickname)}
					width="600"
					height="600"
					faceCrop={true}
					class="modalHeroAvatar"
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

	.authCallout {
		margin-top: var(--spacing-md);
		display: grid;
		gap: var(--spacing-sm);
	}

	.authCallout p {
		margin: 0;
		color: var(--textMuted);
		font-weight: 500;
	}

	.authActions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.authLink {
		display: inline-block;
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		background: var(--primaryColor);
		color: var(--contrastColor);
		border: 1px solid oklch(from var(--primaryColor) l c h / 0.55);
	}

	.authLink:hover {
		filter: brightness(1.05);
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

	.sponsorshipTypeFieldset {
		margin: 0;
		padding: 0;
		border: none;
		display: grid;
		gap: var(--spacing-sm);
	}

	.labelHeading {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: 0;
		font-weight: 600;
	}

	.radioGroup {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: var(--spacing-sm);
	}

	.radioLabel {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		background: var(--backgroundColor);
		font-weight: 500;
		cursor: pointer;
	}

	.radioLabel input[type='radio'] {
		accent-color: var(--primaryColor);
	}

	.tooltipWrapper {
		position: relative;
		display: inline-grid;
		place-items: center;
	}

	.tooltipTrigger {
		all: unset;
		width: 1.2rem;
		height: 1.2rem;
		border-radius: 999px;
		display: grid;
		place-items: center;
		font-size: 0.75rem;
		line-height: 1;
		font-weight: 700;
		color: var(--contrastColor);
		background: var(--primaryColor);
		box-shadow: var(--shadow-sm);
		cursor: help;
	}

	.tooltipTrigger:focus-visible {
		outline: 2px solid oklch(from var(--primaryColor) l c h / 0.5);
		outline-offset: 2px;
	}

	.tooltipBubble {
		position: absolute;
		left: 50%;
		top: calc(100% + 0.4rem);
		transform: translate(-50%, -6px);
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		width: min(280px, 80vw);
		padding: 0.55rem 0.65rem;
		border-radius: var(--radius-md);
		background: oklch(0.28 0.02 256);
		color: oklch(0.98 0.01 256);
		font-size: 0.82rem;
		font-weight: 500;
		line-height: 1.35;
		text-wrap: balance;
		box-shadow: var(--shadow-sm);
		transition:
			opacity 180ms ease,
			transform 180ms ease,
			visibility 180ms ease;
		z-index: 5;
	}

	.tooltipBubble::before {
		content: '';
		position: absolute;
		left: 50%;
		top: -0.35rem;
		transform: translateX(-50%) rotate(45deg);
		width: 0.7rem;
		height: 0.7rem;
		background: inherit;
	}

	.tooltipWrapper:hover .tooltipBubble,
	.tooltipWrapper:focus-within .tooltipBubble {
		opacity: 1;
		visibility: visible;
		transform: translate(-50%, 0);
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

	.kidsSection {
		display: grid;
		gap: var(--spacing-lg);
	}

	.kidsSectionTitle {
		margin: 0;
		color: var(--primaryColor);
	}

	.kidsGroup {
		display: grid;
		gap: var(--spacing-sm);
	}

	.kidsGroupTitle {
		margin: 0;
		font-size: 1.15rem;
		color: var(--textColor);
	}

	.kidsGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: var(--spacing-lg);
	}

	.kidCardButton {
		background: transparent;
		padding: 0;
		width: 100%;
		height: 100%;
	}

	.kidCard {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		transition: transform var(--transition-base);
		padding: var(--spacing-sm);
		display: grid;
		justify-items: center;
		grid-template-rows: auto 1fr;
		gap: var(--spacing-xs);
		height: 100%;
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
		grid-template-rows: auto auto 1fr;
		justify-items: center;
		text-align: center;
		width: 100%;
	}

	.kidBody h2 {
		color: var(--primaryColor);
		font-size: 1rem;
		margin: 0;
	}

	.viewProfile {
		margin: 10px 0 0 0;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--contrastColor);
		background: var(--primaryColor);
		border: 1px solid oklch(from var(--primaryColor) l c h / 0.65);
		border-radius: 999px;
		padding: 0.35rem 0.7rem;
		line-height: 1.1;
		align-self: end;
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
		margin: 0 auto var(--spacing-md);
		width: min(300px, 100%);
		aspect-ratio: 1;
		flex-shrink: 0;
	}

	.modalFeaturedImage :global(.modalHeroAvatar) {
		width: 100%;
		height: 100%;
		max-width: none;
		border-radius: 50%;
		display: block;
		object-fit: cover;
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
		width: 2.6rem;
		height: 2.6rem;
		padding: 0;
		display: grid;
		place-items: center;
		border-radius: 999px;
		font-size: 1.2rem;
		line-height: 1;
		background: var(--surfaceColor);
		color: var(--textColor);
		border: 2px solid var(--borderColor);
	}

	.closeIcon {
		width: 1.55rem;
		height: 1.55rem;
		stroke: currentColor;
		stroke-width: 2.8;
		stroke-linecap: round;
		fill: none;
	}

	.chooseKidButton {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}
</style>
