<script lang="ts">
	import { AdminImage, formatKidDisplayName } from '$lib';
	import CloudinaryUpload from '$lib/components/CloudinaryUpload.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import type { KidWithSponsors, Sponsor } from '$lib/server/sponsors';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();

	const kids = $derived(data.kids as KidWithSponsors[]);
	const allSponsors = $derived(data.sponsors as Sponsor[]);
	let editingKid = $state<KidWithSponsors | null>(null);
	let isCreating = $state(false);
	let viewMode = $state<'grid' | 'list'>('grid');
	let showImageUpload = $state(false);
	let showImageGallery = $state(false);
	let existingImages = $state<Array<{ publicId: string; url: string }>>([]);
	let errorMessage = $state<string | null>(null);
	let showArchived = $state(false);
	let genderFilter = $state<'all' | 'Male' | 'Female'>('all');
	let archivingKid = $state<KidWithSponsors | null>(null);
	let archiveReasonInput = $state('');

	function getImagePreviewSource(publicId: string): string {
		const match = existingImages.find((img) => img.publicId === publicId);
		return match?.url || publicId;
	}

	let formData = $state({
		name: '',
		nickname: '',
		tagline: '',
		birthday: '',
		gender: '',
		featuredImage: '',
		description: '',
		images: [] as string[],
		sponsorIds: [] as string[]
	});

	// Sort kids alphabetically by name
	const sortedKids = $derived(
		[...kids].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
	);

	const filteredKids = $derived.by(() => {
		let list = sortedKids;
		if (!showArchived) {
			list = list.filter((k) => !k.archived);
		}
		if (genderFilter !== 'all') {
			list = list.filter((k) => k.gender === genderFilter);
		}
		return list;
	});

	// Sort sponsors alphabetically by name
	const sortedSponsors = $derived(
		[...allSponsors].sort((a, b) =>
			`${a.firstName} ${a.lastName}`
				.toLowerCase()
				.localeCompare(`${b.firstName} ${b.lastName}`.toLowerCase())
		)
	);

	async function refreshData() {
		await invalidateAll();
	}

	async function loadExistingImages() {
		try {
			const response = await fetch('/api/cloudinary/images?folder=zim-admin');
			if (response.ok) {
				const imagesData = await response.json();
				existingImages = imagesData.images;
			}
		} catch (error) {
			console.error('Error loading images:', error);
		}
	}

	function startCreating() {
		isCreating = true;
		editingKid = null;
		formData = {
			name: '',
			nickname: '',
			tagline: '',
			birthday: '',
			gender: '',
			featuredImage: '',
			description: '',
			images: [],
			sponsorIds: []
		};
		loadExistingImages();
	}

	function startEditing(kid: KidWithSponsors) {
		isCreating = false;
		editingKid = kid;
		formData = {
			name: kid.name,
			nickname: kid.nickname || '',
			tagline: kid.tagline || '',
			birthday: kid.birthday ? new Date(kid.birthday).toISOString().split('T')[0] : '',
			gender: kid.gender || '',
			featuredImage: kid.featuredImage || kid.image || '',
			description: kid.description || '',
			images: kid.images || [],
			sponsorIds: kid.sponsors.map((s) => s.id)
		};
		if (formData.featuredImage && !formData.images.includes(formData.featuredImage)) {
			formData.images = [formData.featuredImage, ...formData.images];
		}
		loadExistingImages();
	}

	function cancelForm() {
		isCreating = false;
		editingKid = null;
		showImageUpload = false;
		showImageGallery = false;
		formData = {
			name: '',
			nickname: '',
			tagline: '',
			birthday: '',
			gender: '',
			featuredImage: '',
			description: '',
			images: [],
			sponsorIds: []
		};
	}

	async function saveKid() {
		errorMessage = null;
		try {
			const url = editingKid ? `/api/kids/${editingKid.id}` : '/api/kids';
			const method = editingKid ? 'PUT' : 'POST';

			const payload: Record<string, unknown> = {
				name: formData.name,
				nickname: formData.nickname.trim() || null,
				tagline: formData.tagline || null,
				gender: formData.gender || null,
				image: formData.featuredImage || null,
				description: formData.description || null,
				featuredImage: formData.featuredImage || null,
				images: formData.images,
				sponsorIds: formData.sponsorIds
			};

			if (formData.birthday) {
				payload.birthday = formData.birthday;
			}

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				await refreshData();
				cancelForm();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to save kid';
			}
		} catch (error) {
			console.error('Error saving kid:', error);
			errorMessage = 'An error occurred while saving';
		}
	}

	async function deleteKid(id: string) {
		if (!confirm('Are you sure you want to delete this kid?')) return;

		errorMessage = null;
		try {
			const response = await fetch(`/api/kids/${id}`, { method: 'DELETE' });
			if (response.ok) {
				await refreshData();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to delete kid';
			}
		} catch (error) {
			console.error('Error deleting kid:', error);
			errorMessage = 'An error occurred while deleting';
		}
	}

	function openArchiveModal(kid: KidWithSponsors) {
		archivingKid = kid;
		archiveReasonInput = '';
		errorMessage = null;
	}

	function closeArchiveModal() {
		archivingKid = null;
		archiveReasonInput = '';
	}

	async function confirmArchive() {
		if (!archivingKid) return;
		const reason = archiveReasonInput.trim();
		errorMessage = null;
		try {
			const response = await fetch(`/api/kids/${archivingKid.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					archived: true,
					archiveReason: reason.length > 0 ? reason : null
				})
			});
			if (response.ok) {
				closeArchiveModal();
				await refreshData();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to archive kid';
			}
		} catch (error) {
			console.error('Error archiving kid:', error);
			errorMessage = 'An error occurred while archiving';
		}
	}

	async function unarchiveKid(id: string) {
		errorMessage = null;
		try {
			const response = await fetch(`/api/kids/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ archived: false })
			});
			if (response.ok) {
				await refreshData();
			} else {
				const result = await response.json();
				errorMessage = result.error || 'Failed to restore kid';
			}
		} catch (error) {
			console.error('Error unarchiving kid:', error);
			errorMessage = 'An error occurred while restoring';
		}
	}

	function toggleSponsor(sponsorId: string) {
		if (formData.sponsorIds.includes(sponsorId)) {
			formData.sponsorIds = formData.sponsorIds.filter((id) => id !== sponsorId);
		} else {
			formData.sponsorIds = [...formData.sponsorIds, sponsorId];
		}
	}

	function handleImageUpload(publicId: string) {
		if (!formData.images.includes(publicId)) {
			formData.images = [...formData.images, publicId];
		}
		if (!formData.featuredImage) {
			formData.featuredImage = publicId;
		}
		showImageUpload = false;
		showImageGallery = false;
		loadExistingImages();
	}

	function selectExistingImage(publicId: string) {
		if (!formData.images.includes(publicId)) {
			formData.images = [...formData.images, publicId];
		}
		if (!formData.featuredImage) {
			formData.featuredImage = publicId;
		}
		showImageGallery = false;
	}

	function addGalleryImage(publicId: string) {
		if (formData.images.includes(publicId)) return;
		formData.images = [...formData.images, publicId];
		if (!formData.featuredImage) {
			formData.featuredImage = publicId;
		}
	}

	function removeGalleryImage(publicId: string) {
		formData.images = formData.images.filter((image) => image !== publicId);
		if (formData.featuredImage === publicId) {
			formData.featuredImage = formData.images[0] || '';
		}
	}

	function setFeaturedImage(publicId: string) {
		if (!formData.images.includes(publicId)) {
			formData.images = [publicId, ...formData.images];
		}
		formData.featuredImage = publicId;
	}

	function toggleGallery() {
		showImageGallery = !showImageGallery;
		showImageUpload = false;
		if (showImageGallery && existingImages.length === 0) {
			loadExistingImages();
		}
	}

	function toggleUpload() {
		showImageUpload = !showImageUpload;
		showImageGallery = false;
	}
</script>

<svelte:head>
	<title>Kids Management - Admin - Zim Updates</title>
	<meta name="description" content="Manage kids information and profiles in the admin panel." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="adminPage">
	<div class="header">
		<div>
			<h2>Kids Management</h2>
			<p class="subtitle">Manage kids information and profiles</p>
		</div>
		<div class="headerActions">
			<div class="viewToggle" role="group" aria-label="Kid view mode">
				<button
					type="button"
					class="viewButton"
					class:active={viewMode === 'grid'}
					onclick={() => (viewMode = 'grid')}
				>
					Grid
				</button>
				<button
					type="button"
					class="viewButton"
					class:active={viewMode === 'list'}
					onclick={() => (viewMode = 'list')}
				>
					List
				</button>
			</div>
			<button class="primaryButton" onclick={startCreating}>+ Add Kid</button>
		</div>
	</div>

	{#if errorMessage}
		<div class="errorBanner" role="alert">
			<p>{errorMessage}</p>
			<button onclick={() => (errorMessage = null)} class="dismissButton">Dismiss</button>
		</div>
	{/if}

	{#if kids.length > 0}
		<div class="filtersBar">
			<div class="filterGroup">
				<span class="filterLabel" id="genderFilterLabel">Gender</span>
				<div class="filterToggle" role="radiogroup" aria-labelledby="genderFilterLabel">
					<button
						type="button"
						class="filterButton"
						class:active={genderFilter === 'all'}
						onclick={() => (genderFilter = 'all')}
					>
						All
					</button>
					<button
						type="button"
						class="filterButton"
						class:active={genderFilter === 'Male'}
						onclick={() => (genderFilter = 'Male')}
					>
						Male
					</button>
					<button
						type="button"
						class="filterButton"
						class:active={genderFilter === 'Female'}
						onclick={() => (genderFilter = 'Female')}
					>
						Female
					</button>
				</div>
			</div>
			<label class="showArchivedLabel">
				<input type="checkbox" bind:checked={showArchived} />
				<span>Show archived</span>
			</label>
		</div>
	{/if}

	{#if kids.length > 0}
		{#if filteredKids.length > 0}
			<div class="kidsGrid" class:listView={viewMode === 'list'}>
				{#each filteredKids as kid (kid.id)}
					<div class="kidCard" class:archivedKid={kid.archived}>
						{#if kid.featuredImage || kid.image}
							<div class="kidImage">
								<AdminImage
									source={(kid.featuredImage ?? kid.image)!}
									altTag={formatKidDisplayName(kid.name, kid.nickname)}
									width="300"
									height="300"
									faceCrop={true}
								/>
							</div>
						{:else}
							<div class="placeholderImage">
								<span>👩🏾‍🦱🧑🏾‍🦱</span>
							</div>
						{/if}

						<div class="kidInfo">
							<h3>{formatKidDisplayName(kid.name, kid.nickname)}</h3>
							{#if kid.archived}
								<p class="archivedBadge">Archived</p>
								{#if kid.archiveReason}
									<p class="archiveReasonText">{kid.archiveReason}</p>
								{/if}
							{/if}

							{#if kid.birthday}
								<p class="infoItem">🎂 {new Date(kid.birthday).toLocaleDateString()}</p>
							{/if}

							{#if kid.gender}
								<p class="infoItem">{kid.gender}</p>
							{/if}

							<!-- {#if kid.images?.length > 0}
							<div class="galleryPreview">
								{#each kid.images.slice(0, 3) as photo (photo)}
									<AdminImage
										source={photo}
										altTag={`${formatKidDisplayName(kid.name, kid.nickname)} photo`}
										width="80"
										height="80"
										faceCrop={true}
									/>
								{/each}
							</div>
						{/if} -->

							{#if kid.sponsors.length > 0}
								<div class="sponsorsSection">
									<p class="sponsorsLabel">Sponsored by:</p>
									<div class="sponsorsList">
										{#each kid.sponsors as sponsor (sponsor.id)}
											<span class="sponsorBadge">
												{sponsor.firstName}
												{sponsor.lastName}
											</span>
										{/each}
									</div>
								</div>
							{:else}
								<p class="noSponsors">No sponsors yet</p>
							{/if}
						</div>

						<div class="cardActions">
							<button class="editButton" onclick={() => startEditing(kid)}>Edit</button>
							{#if kid.archived}
								<button type="button" class="unarchiveButton" onclick={() => unarchiveKid(kid.id)}>
									Restore
								</button>
							{:else}
								<button type="button" class="archiveButton" onclick={() => openArchiveModal(kid)}>
									Archive
								</button>
							{/if}
							<button class="deleteButton" onclick={() => deleteKid(kid.id)}>Delete</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="emptyState filterEmpty">
				<p>
					No kids match these filters. Try turning on Show archived or choosing a different gender.
				</p>
			</div>
		{/if}
	{:else}
		<div class="emptyState">
			<p>No kids yet. Click "Add Kid" to create one.</p>
		</div>
	{/if}
</div>

<!-- Modal Overlay -->
{#if isCreating || editingKid}
	<div
		class="modalOverlay"
		onclick={cancelForm}
		onkeydown={(e) => e.key === 'Escape' && cancelForm()}
		role="button"
		tabindex="-1"
	></div>
	<div class="modalContainer" role="dialog" aria-modal="true" aria-label="Kid form">
		<div class="modalHeader">
			<h3>{editingKid ? 'Edit Kid' : 'Add New Kid'}</h3>
			<button class="closeButton" onclick={cancelForm} aria-label="Close modal">✕</button>
		</div>

		<div class="modalContent">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveKid();
				}}
			>
				<div class="formGroup">
					<label for="name">Name *</label>
					<input type="text" id="name" bind:value={formData.name} required />
				</div>

				<div class="formGroup">
					<label for="nickname">Nickname</label>
					<input
						type="text"
						id="nickname"
						bind:value={formData.nickname}
						placeholder="Optional; shown in parentheses after the name"
					/>
				</div>

				<div class="formGroup">
					<label for="tagline">Tagline</label>
					<input
						type="text"
						id="tagline"
						bind:value={formData.tagline}
						placeholder="Optional short line for this kid"
					/>
				</div>

				<div class="formGroup">
					<label for="birthday">Birthday</label>
					<input type="date" id="birthday" bind:value={formData.birthday} />
				</div>

				<div class="formGroup">
					<div class="fieldLabel">Gender</div>
					<div class="genderOptions" role="radiogroup" aria-label="Gender">
						<label class="genderOption">
							<input type="radio" name="gender" value="Male" bind:group={formData.gender} />
							<span>Male</span>
						</label>
						<label class="genderOption">
							<input type="radio" name="gender" value="Female" bind:group={formData.gender} />
							<span>Female</span>
						</label>
					</div>
				</div>

				<div class="formGroup">
					<label for="description">Description</label>
					<RichTextEditor
						content={formData.description}
						onchange={(html) => (formData.description = html)}
						placeholder="Share this kid's story, interests, and prayer needs..."
						forceWhiteText={true}
					/>
				</div>

				<div class="formGroup">
					<div class="fieldLabel">Featured Image</div>
					<div class="imageSection">
						{#if formData.featuredImage}
							<div class="selectedImage">
								<AdminImage
									source={getImagePreviewSource(formData.featuredImage)}
									altTag={formatKidDisplayName(formData.name, formData.nickname)}
									width="200"
								/>
								<div class="imageActions">
									<button type="button" class="changeImageButton" onclick={toggleGallery}>
										{showImageGallery ? 'Cancel' : 'Gallery'}
									</button>
									<button type="button" class="changeImageButton" onclick={toggleUpload}>
										{showImageUpload ? 'Cancel' : 'Upload'}
									</button>
								</div>
							</div>
						{:else}
							<div class="imageActions">
								<button type="button" class="selectImageButton" onclick={toggleGallery}>
									Choose from Gallery
								</button>
								<button type="button" class="selectImageButton" onclick={toggleUpload}>
									Upload New Image
								</button>
							</div>
						{/if}
					</div>

					{#if showImageGallery}
						<div class="gallerySection">
							<h4>Select from Existing Images</h4>
							{#if existingImages.length > 0}
								<div class="imageGrid">
									{#each existingImages as img (img.publicId)}
										<button
											type="button"
											class="galleryImage"
											onclick={() => selectExistingImage(img.publicId)}
										>
											<AdminImage source={img.url} altTag="Gallery image" width="100" />
											<div class="imageOverlay">Select</div>
										</button>
									{/each}
								</div>
							{:else}
								<p class="noImages">No images found.</p>
							{/if}
						</div>
					{/if}

					{#if showImageUpload}
						<div class="uploadSection">
							<h4>Upload New Image</h4>
							<CloudinaryUpload
								folder="zim-admin"
								tags={['kid-profile']}
								onSuccess={handleImageUpload}
							/>
						</div>
					{/if}
				</div>

				<div class="formGroup">
					<div class="fieldLabel">Sponsors</div>
					<div class="sponsorsGrid">
						{#each sortedSponsors as sponsor (sponsor.id)}
							<label class="sponsorCheckbox">
								<input
									type="checkbox"
									checked={formData.sponsorIds.includes(sponsor.id)}
									onchange={() => toggleSponsor(sponsor.id)}
								/>
								<span>{sponsor.firstName} {sponsor.lastName}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="formGroup">
					<div class="fieldLabel">Gallery Images</div>
					{#if formData.images.length > 0}
						<div class="selectedGalleryGrid">
							{#each formData.images as image (image)}
								<div class="selectedGalleryItem">
									<AdminImage
										source={image}
										altTag={`${formatKidDisplayName(formData.name, formData.nickname)} gallery image`}
										width="640"
										height="320"
										faceCrop={true}
									/>
									<div class="selectedGalleryActions">
										<button
											type="button"
											class="setFeaturedButton"
											class:activeFeatured={formData.featuredImage === image}
											onclick={() => setFeaturedImage(image)}
										>
											{formData.featuredImage === image ? 'Featured' : 'Set Featured'}
										</button>
										<button
											type="button"
											class="removeImageButton"
											onclick={() => removeGalleryImage(image)}
										>
											Remove
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="noImages">No gallery images selected yet.</p>
					{/if}
				</div>

				<div class="formActions">
					<button type="submit" class="primaryButton">Save</button>
					<button type="button" class="secondaryButton" onclick={cancelForm}>Cancel</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if archivingKid}
	<div
		class="modalOverlay archiveModalLayer"
		onclick={closeArchiveModal}
		onkeydown={(e) => e.key === 'Escape' && closeArchiveModal()}
		role="button"
		tabindex="-1"
	></div>
	<div class="modalContainer archiveModal" role="dialog" aria-modal="true" aria-label="Archive kid">
		<div class="modalHeader">
			<h3>Archive {formatKidDisplayName(archivingKid.name, archivingKid.nickname)}</h3>
			<button class="closeButton" onclick={closeArchiveModal} aria-label="Close">✕</button>
		</div>
		<div class="modalContent">
			<p class="archiveIntro">
				You can add an optional note (for example, graduated the program) when archiving.
			</p>
			<div class="formGroup">
				<label for="archiveReason">Reason (optional)</label>
				<textarea
					id="archiveReason"
					class="archiveReasonField"
					rows="3"
					bind:value={archiveReasonInput}
					placeholder="e.g. Graduated from the program in 2025"
				></textarea>
			</div>
			<div class="formActions archiveModalActions">
				<button type="button" class="primaryButton" onclick={confirmArchive}>Archive</button>
				<button type="button" class="secondaryButton" onclick={closeArchiveModal}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.adminPage {
		animation: cardsIn var(--transition-base);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--spacing-xl);
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.headerActions {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.viewToggle {
		display: inline-grid;
		grid-template-columns: 1fr 1fr;
		background: var(--surfaceColor);
		border: 1px solid var(--borderColor, #ddd);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.viewButton {
		border: none;
		padding: var(--spacing-sm) var(--spacing-md);
		cursor: pointer;
		background: transparent;
		color: var(--textMuted);
		font-weight: 600;
	}

	.viewButton.active {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	h2 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.subtitle {
		color: var(--textMuted);
	}

	.filtersBar {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		border: 1px solid var(--borderColor, #ddd);
		flex-wrap: wrap;
	}

	.filterGroup {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.filterLabel {
		font-weight: 600;
		color: var(--textColor);
		font-size: 0.875rem;
	}

	.filterToggle {
		display: inline-grid;
		grid-template-columns: repeat(3, 1fr);
		background: var(--backgroundColor);
		border: 1px solid var(--borderColor, #ddd);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.filterButton {
		border: none;
		padding: var(--spacing-sm) var(--spacing-md);
		cursor: pointer;
		background: transparent;
		color: var(--textMuted);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.filterButton.active {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.showArchivedLabel {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--textColor);
	}

	.showArchivedLabel input {
		width: 1rem;
		height: 1rem;
		accent-color: var(--primaryColor);
	}

	@media (max-width: 40rem) {
		.filtersBar {
			grid-template-columns: 1fr;
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
	}

	.primaryButton:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}

	/* Modal Styles */
	.modalOverlay {
		position: fixed;
		inset: 0;
		background: oklch(0 0 0 / 0.5);
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	}

	.archiveModalLayer {
		z-index: 1002;
	}

	.modalContainer.archiveModal {
		z-index: 1003;
		width: min(440px, 94vw);
		max-height: 85vh;
	}

	.archiveIntro {
		color: var(--textMuted);
		margin: 0 0 var(--spacing-md);
		line-height: 1.5;
		font-size: 0.9375rem;
	}

	.archiveReasonField {
		width: 100%;
		padding: var(--spacing-sm);
		border: 1px solid var(--borderColor, #ddd);
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-family: inherit;
		background: var(--backgroundColor);
		color: var(--textColor);
		resize: vertical;
		min-height: 4.5rem;
		box-sizing: border-box;
	}

	.archiveModalActions {
		border-top: none;
		padding-top: 0;
		margin-top: var(--spacing-md);
		position: static;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modalContainer {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(900px, 94vw);
		max-height: 92vh;
		background: var(--surfaceColor);
		box-shadow: var(--shadow-lg, 0 10px 30px oklch(0 0 0 / 0.25));
		z-index: 1001;
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.modalHeader {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--borderColor, #ddd);
		background: var(--backgroundColor);
	}

	.modalHeader h3 {
		color: var(--primaryColor);
		margin: 0;
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
	}

	.closeButton:hover {
		color: var(--primaryColor);
	}

	.modalContent {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
	}

	.formGroup {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-lg);
	}

	.formGroup label,
	.fieldLabel {
		font-weight: 600;
		color: var(--textColor);
	}

	.formGroup input {
		padding: var(--spacing-sm);
		border: 1px solid var(--borderColor, #ddd);
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: var(--backgroundColor);
		color: var(--textColor);
	}

	.formGroup input[type='radio'] {
		padding: 0;
		border: none;
		background: transparent;
	}

	.genderOptions {
		display: flex;
		flex-wrap: nowrap;
		gap: var(--spacing-md);
		background: var(--backgroundColor);
		padding: var(--spacing-sm);
		border-radius: var(--radius-md);
	}

	.genderOption {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		cursor: pointer;
		font-weight: 500;
	}

	.imageSection {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.selectedImage {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
		max-width: 300px;
	}

	.imageActions {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.selectImageButton,
	.changeImageButton {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: 2px dashed var(--primaryColor);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--primaryColor);
		cursor: pointer;
		font-weight: 600;
		transition: all var(--transition-base);
		flex: 1;
		min-width: 150px;
	}

	.selectImageButton:hover,
	.changeImageButton:hover {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.uploadSection,
	.gallerySection {
		padding: var(--spacing-lg);
		background: var(--backgroundColor);
		border-radius: var(--radius-md);
		margin-top: var(--spacing-md);
	}

	.gallerySection h4,
	.uploadSection h4 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-md);
		font-size: 1.1rem;
	}

	.imageGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: var(--spacing-sm);
		max-height: 250px;
		overflow-y: auto;
	}

	.galleryImage {
		position: relative;
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		overflow: hidden;
		cursor: pointer;
		background: var(--surfaceColor);
		padding: 0;
		transition: all var(--transition-base);
	}

	.galleryImage:hover {
		border-color: var(--primaryColor);
		transform: scale(1.05);
	}

	.imageOverlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--primaryColor);
		color: var(--contrastColor);
		padding: var(--spacing-xs);
		text-align: center;
		font-weight: 600;
		opacity: 0;
		transition: opacity var(--transition-base);
	}

	.galleryImage:hover .imageOverlay {
		opacity: 1;
	}

	.noImages {
		color: var(--textMuted);
		font-style: italic;
		text-align: center;
		padding: var(--spacing-lg);
	}

	.sponsorsGrid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--backgroundColor);
		border-radius: var(--radius-md);
		max-height: 200px;
		overflow-y: auto;
	}

	.sponsorCheckbox {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		cursor: pointer;
	}

	.formActions {
		display: flex;
		gap: var(--spacing-md);
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-lg);
		padding-bottom: var(--spacing-lg);
		border-top: 1px solid var(--borderColor, #ddd);
		position: sticky;
		bottom: calc(-1 * var(--spacing-lg));
		background: var(--surfaceColor);
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
	}

	.secondaryButton:hover {
		background: var(--surfaceColor);
	}

	.kidsGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: var(--spacing-lg);
	}

	.kidsGrid.listView {
		grid-template-columns: 1fr;
	}

	.kidCard {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-lg) var(--spacing-md) var(--spacing-md);
	}

	.kidsGrid.listView .kidCard {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
	}

	.kidCard:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.kidCard.archivedKid {
		border: 1px dashed oklch(from var(--textMuted) l c h / 0.45);
	}

	.archivedBadge {
		display: inline-block;
		margin: 0 auto var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: oklch(0.55 0.08 250);
		color: oklch(0.98 0.01 250);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.kidsGrid:not(.listView) .archivedBadge {
		margin-left: auto;
		margin-right: auto;
	}

	.archiveReasonText {
		font-size: 0.8125rem;
		color: var(--textMuted);
		margin: 0 0 var(--spacing-sm);
		line-height: 1.4;
		text-align: center;
	}

	.kidsGrid.listView .archiveReasonText {
		text-align: left;
	}

	.kidImage {
		width: 132px;
		height: 132px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid oklch(from var(--primaryColor) l c h / 0.35);
		box-shadow: var(--shadow-sm);
	}

	.placeholderImage {
		width: 132px;
		height: 132px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--backgroundColor);
		font-size: 3rem;
	}

	.kidInfo {
		padding: var(--spacing-lg);
		flex-grow: 1;
		text-align: center;
		width: 100%;
	}

	.kidsGrid.listView .kidInfo {
		text-align: left;
		padding: var(--spacing-sm) 0;
	}

	.kidInfo h3 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
	}

	.infoItem {
		color: var(--textMuted);
		margin: var(--spacing-xs) 0;
	}

	.selectedGalleryGrid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.selectedGalleryItem {
		display: grid;
		grid-template-rows: 200px auto;
		gap: var(--spacing-xs);
		:global(img) {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.selectedGalleryActions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-xs);
	}

	.setFeaturedButton {
		border: 1px solid var(--primaryColor);
		color: var(--primaryColor);
		background: transparent;
		border-radius: var(--radius-sm);
		padding: var(--spacing-xs);
		cursor: pointer;
	}

	.setFeaturedButton.activeFeatured {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.removeImageButton {
		border: 1px solid #dc2626;
		color: #dc2626;
		background: transparent;
		border-radius: var(--radius-sm);
		padding: var(--spacing-xs);
		cursor: pointer;
	}

	.sponsorsSection {
		margin-top: var(--spacing-md);
	}

	.sponsorsLabel {
		font-weight: 600;
		margin-bottom: var(--spacing-xs);
		color: var(--textColor);
		font-size: 0.875rem;
	}

	.sponsorsList {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.sponsorBadge {
		width: 100%;
		background: var(--primaryColor);
		color: var(--contrastColor);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
	}

	.noSponsors {
		color: var(--textMuted);
		font-style: italic;
		margin-top: var(--spacing-sm);
		font-size: 0.875rem;
	}

	.cardActions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		border-top: 1px solid var(--borderColor, #ddd);
	}

	.kidsGrid.listView .cardActions {
		border-top: none;
		padding: 0;
		min-width: 180px;
	}

	.editButton,
	.archiveButton,
	.unarchiveButton,
	.deleteButton {
		flex: 1;
		min-width: 5.5rem;
		padding: var(--spacing-sm);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		font-weight: 600;
		transition: all var(--transition-base);
	}

	.editButton {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.archiveButton {
		background: transparent;
		color: oklch(0.55 0.12 70);
		border: 1px solid oklch(0.55 0.12 70);
	}

	.unarchiveButton {
		background: transparent;
		color: var(--primaryColor);
		border: 1px solid var(--primaryColor);
	}

	.deleteButton {
		background: transparent;
		color: #dc2626;
		border: 1px solid #dc2626;
	}

	.editButton:hover,
	.archiveButton:hover,
	.unarchiveButton:hover,
	.deleteButton:hover {
		opacity: 0.8;
	}

	.emptyState {
		text-align: center;
		color: var(--textMuted);
		padding: var(--spacing-2xl);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
	}

	.filterEmpty {
		margin-bottom: var(--spacing-xl);
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
	}

	.errorBanner p {
		margin: 0;
	}

	.errorBanner .dismissButton {
		background: transparent;
		border: 1px solid currentColor;
		color: inherit;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.errorBanner .dismissButton:hover {
		background: oklch(0.4 0.15 20);
		color: white;
	}
</style>
