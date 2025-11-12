<script lang="ts">
	import { AdminImage } from '$lib';
	import CloudinaryUpload from '$lib/components/CloudinaryUpload.svelte';
	import type { KidWithSponsors, Sponsor } from '$lib/server/sponsors';

	let kids = $state<KidWithSponsors[]>([]);
	let allSponsors = $state<Sponsor[]>([]);
	let loading = $state(true);
	let editingKid = $state<KidWithSponsors | null>(null);
	let isCreating = $state(false);
	let showImageUpload = $state(false);
	let showImageGallery = $state(false);
	let existingImages = $state<Array<{ publicId: string; url: string }>>([]);

	let formData = $state({
		name: '',
		birthday: '',
		gender: '',
		image: '',
		sponsorIds: [] as string[]
	});

	async function loadKids() {
		try {
			const response = await fetch('/api/kids');
			if (response.ok) {
				const data = await response.json();
				kids = data.kids;
			}
		} catch (error) {
			console.error('Error loading kids:', error);
		} finally {
			loading = false;
		}
	}

	async function loadSponsors() {
		try {
			const response = await fetch('/api/sponsors');
			if (response.ok) {
				const data = await response.json();
				allSponsors = data.sponsors;
			}
		} catch (error) {
			console.error('Error loading sponsors:', error);
		}
	}

	async function loadExistingImages() {
		try {
			const response = await fetch('/api/cloudinary/images?folder=zim-admin');
			if (response.ok) {
				const data = await response.json();
				existingImages = data.images;
				console.log('Loaded images:', existingImages.length);
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
			birthday: '',
			gender: '',
			image: '',
			sponsorIds: []
		};
	}

	function startEditing(kid: KidWithSponsors) {
		isCreating = false;
		editingKid = kid;
		formData = {
			name: kid.name,
			birthday: kid.birthday ? new Date(kid.birthday).toISOString().split('T')[0] : '',
			gender: kid.gender || '',
			image: kid.image || '',
			sponsorIds: kid.sponsors.map((s) => s.id)
		};
	}

	function cancelForm() {
		isCreating = false;
		editingKid = null;
		showImageUpload = false;
		showImageGallery = false;
		formData = {
			name: '',
			birthday: '',
			gender: '',
			image: '',
			sponsorIds: []
		};
	}

	async function saveKid() {
		try {
			const url = editingKid ? `/api/kids/${editingKid.id}` : '/api/kids';
			const method = editingKid ? 'PUT' : 'POST';

			const payload: any = {
				name: formData.name,
				gender: formData.gender || null,
				image: formData.image || null,
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
				await loadKids();
				cancelForm();
			}
		} catch (error) {
			console.error('Error saving kid:', error);
		}
	}

	async function deleteKid(id: string) {
		if (!confirm('Are you sure you want to delete this kid?')) return;

		try {
			const response = await fetch(`/api/kids/${id}`, { method: 'DELETE' });
			if (response.ok) {
				await loadKids();
			}
		} catch (error) {
			console.error('Error deleting kid:', error);
		}
	}

	function toggleSponsor(sponsorId: string) {
		if (formData.sponsorIds.includes(sponsorId)) {
			formData.sponsorIds = formData.sponsorIds.filter((id) => id !== sponsorId);
		} else {
			formData.sponsorIds = [...formData.sponsorIds, sponsorId];
		}
	}

	function handleImageUpload(publicId: string, url: string) {
		formData.image = publicId;
		showImageUpload = false;
		showImageGallery = false;
		loadExistingImages();
	}

	function selectExistingImage(publicId: string) {
		formData.image = publicId;
		showImageGallery = false;
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

	$effect(() => {
		loadKids();
		loadSponsors();
	});
</script>

<div class="adminPage">
	<div class="header">
		<div>
			<h2>Kids Management</h2>
			<p class="subtitle">Manage kids information and profiles</p>
		</div>
		<button class="primaryButton" onclick={startCreating}>+ Add Kid</button>
	</div>

	{#if isCreating || editingKid}
		<div class="formCard">
			<h3>{editingKid ? 'Edit Kid' : 'Add New Kid'}</h3>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					saveKid();
				}}
			>
				<div class="formGrid">
					<div class="formGroup">
						<label for="name">Name *</label>
						<input type="text" id="name" bind:value={formData.name} required />
					</div>

					<div class="formGroup">
						<label for="birthday">Birthday</label>
						<input type="date" id="birthday" bind:value={formData.birthday} />
					</div>

					<div class="formGroup">
						<label for="gender">Gender</label>
						<select id="gender" bind:value={formData.gender}>
							<option value="">Select...</option>
							<option value="Male">Male</option>
							<option value="Female">Female</option>
						</select>
					</div>
				</div>

				<div class="formGroup">
					<div class="fieldLabel">Profile Image</div>
					<div class="imageSection">
						{#if formData.image}
							<div class="selectedImage">
								<AdminImage source={formData.image} altTag={formData.name} width="200" />
								<div class="imageActions">
									<button type="button" class="changeImageButton" onclick={toggleGallery}>
										{showImageGallery ? 'Cancel' : 'Choose from Gallery'}
									</button>
									<button type="button" class="changeImageButton" onclick={toggleUpload}>
										{showImageUpload ? 'Cancel' : 'Upload New'}
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
											<AdminImage source={img.publicId} altTag="Gallery image" width="150" />
											<div class="imageOverlay">Select</div>
										</button>
									{/each}
								</div>
							{:else}
								<p class="noImages">No images found. Upload some images in the Media page first.</p>
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
						{#each allSponsors as sponsor}
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

				<div class="formActions">
					<button type="submit" class="primaryButton">Save</button>
					<button type="button" class="secondaryButton" onclick={cancelForm}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	{#if loading}
		<p class="loadingText">Loading kids...</p>
	{:else if kids.length > 0}
		<div class="kidsGrid">
			{#each kids as kid (kid.id)}
				<div class="kidCard">
					{#if kid.image}
						<div class="kidImage">
							<AdminImage source={kid.image} altTag={kid.name} width="300" />
						</div>
					{:else}
						<div class="placeholderImage">
							<span>👧👦</span>
						</div>
					{/if}

					<div class="kidInfo">
						<h3>{kid.name}</h3>

						{#if kid.birthday}
							<p class="infoItem">🎂 {new Date(kid.birthday).toLocaleDateString()}</p>
						{/if}

						{#if kid.gender}
							<p class="infoItem">{kid.gender}</p>
						{/if}

						{#if kid.sponsors.length > 0}
							<div class="sponsorsSection">
								<p class="sponsorsLabel">Sponsored by:</p>
								<div class="sponsorsList">
									{#each kid.sponsors as sponsor}
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
						<button class="deleteButton" onclick={() => deleteKid(kid.id)}>Delete</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="emptyState">
			<p>No kids yet. Click "Add Kid" to create one.</p>
		</div>
	{/if}
</div>

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

	h2 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.subtitle {
		color: var(--textMuted);
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

	.formCard {
		background: var(--surfaceColor);
		padding: var(--spacing-xl);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		margin-bottom: var(--spacing-xl);
	}

	.formCard h3 {
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
	}

	.formGroup label,
	.fieldLabel {
		font-weight: 600;
		color: var(--textColor);
	}

	.formGroup input,
	.formGroup select {
		padding: var(--spacing-sm);
		border: 1px solid var(--borderColor, #ddd);
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: var(--backgroundColor);
		color: var(--textColor);
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
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: var(--spacing-md);
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
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--backgroundColor);
		border-radius: var(--radius-md);
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
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--spacing-lg);
	}

	.kidCard {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.kidCard:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.kidImage {
		width: 100%;
		aspect-ratio: 1;
		overflow: hidden;
	}

	.placeholderImage {
		width: 100%;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--backgroundColor);
		font-size: 4rem;
	}

	.kidInfo {
		padding: var(--spacing-lg);
		flex-grow: 1;
	}

	.kidInfo h3 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
	}

	.infoItem {
		color: var(--textMuted);
		margin: var(--spacing-xs) 0;
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
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		border-top: 1px solid var(--borderColor, #ddd);
	}

	.editButton,
	.deleteButton {
		flex: 1;
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

	.deleteButton {
		background: transparent;
		color: #dc2626;
		border: 1px solid #dc2626;
	}

	.editButton:hover,
	.deleteButton:hover {
		opacity: 0.8;
	}

	.loadingText,
	.emptyState {
		text-align: center;
		color: var(--textMuted);
		padding: var(--spacing-2xl);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
	}
</style>
