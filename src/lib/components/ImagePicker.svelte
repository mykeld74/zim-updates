<script lang="ts">
	import { AdminImage } from '$lib';
	import CloudinaryUpload from './CloudinaryUpload.svelte';

	interface ImageData {
		publicId: string;
		url: string;
	}

	interface Props {
		folder?: string;
		tags?: string[];
		onSelect: (publicId: string) => void;
		onCancel?: () => void;
	}

	const { folder = 'zim-admin', tags = [], onSelect, onCancel }: Props = $props();

	let activeTab = $state<'upload' | 'existing'>('existing');
	let existingImages = $state<ImageData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Load existing images on mount
	$effect(() => {
		loadExistingImages();
	});

	async function loadExistingImages() {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/cloudinary/images');
			if (!response.ok) throw new Error('Failed to load images');

			const data = await response.json();
			existingImages = data.images || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load images';
		} finally {
			loading = false;
		}
	}

	function handleUploadSuccess(publicId: string) {
		onSelect(publicId);
	}

	function selectImage(publicId: string) {
		onSelect(publicId);
	}

	const filteredImages = $derived(() => {
		if (!searchQuery.trim()) return existingImages;
		const query = searchQuery.toLowerCase();
		return existingImages.filter((img) => img.publicId.toLowerCase().includes(query));
	});
</script>

<div class="imagePicker">
	<div class="tabs">
		<button
			type="button"
			class="tab"
			class:active={activeTab === 'existing'}
			onclick={() => (activeTab = 'existing')}
		>
			Choose Existing
		</button>
		<button
			type="button"
			class="tab"
			class:active={activeTab === 'upload'}
			onclick={() => (activeTab = 'upload')}
		>
			Upload New
		</button>
	</div>

	<div class="tabContent">
		{#if activeTab === 'upload'}
			<div class="uploadSection">
				<CloudinaryUpload {folder} {tags} onSuccess={handleUploadSuccess} />
			</div>
		{:else}
			<div class="existingSection">
				<div class="searchBar">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search images..."
						class="searchInput"
					/>
				</div>

				{#if loading}
					<div class="loadingState">
						<p>Loading images...</p>
					</div>
				{:else if error}
					<div class="errorState">
						<p>{error}</p>
						<button type="button" onclick={loadExistingImages}>Retry</button>
					</div>
				{:else if filteredImages().length > 0}
					<div class="imageGrid">
						{#each filteredImages() as img (img.publicId)}
							<button
								type="button"
								class="imageItem"
								onclick={() => selectImage(img.publicId)}
								title={img.publicId}
							>
								<AdminImage source={img.publicId} altTag={img.publicId} width="150" />
								<span class="imageName">{img.publicId.split('/').pop()}</span>
							</button>
						{/each}
					</div>
				{:else}
					<div class="emptyState">
						<p>
							{searchQuery ? 'No images match your search' : 'No images found'}
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if onCancel}
		<div class="actions">
			<button type="button" class="cancelBtn" onclick={onCancel}>Cancel</button>
		</div>
	{/if}
</div>

<style>
	.imagePicker {
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid var(--borderColor);
	}

	.tab {
		flex: 1;
		padding: var(--spacing-md);
		background: transparent;
		border: none;
		font-weight: 600;
		color: var(--textMuted);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.tab:hover {
		color: var(--textColor);
		background: var(--backgroundColor);
	}

	.tab.active {
		color: var(--primaryColor);
		background: var(--backgroundColor);
		border-bottom: 2px solid var(--primaryColor);
	}

	.tabContent {
		padding: var(--spacing-lg);
		max-height: 400px;
		overflow-y: auto;
	}

	.uploadSection {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-xl);
	}

	.existingSection {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.searchBar {
		position: sticky;
		top: 0;
		background: var(--surfaceColor);
		padding-bottom: var(--spacing-sm);
	}

	.searchInput {
		width: 100%;
		padding: var(--spacing-sm);
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		background: var(--backgroundColor);
		color: var(--textColor);
	}

	.searchInput:focus {
		outline: none;
		border-color: var(--primaryColor);
	}

	.imageGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: var(--spacing-sm);
	}

	.imageItem {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--spacing-xs);
		background: var(--backgroundColor);
		border: 2px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		overflow: hidden;
	}

	.imageItem:hover {
		border-color: var(--primaryColor);
		transform: scale(1.02);
	}

	.imageItem :global(img) {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		border-radius: var(--radius-sm);
	}

	.imageName {
		font-size: 0.7rem;
		color: var(--textMuted);
		margin-top: var(--spacing-xs);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.loadingState,
	.errorState,
	.emptyState {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--textMuted);
	}

	.errorState button {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-md);
		background: var(--primaryColor);
		color: var(--contrastColor);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.actions {
		padding: var(--spacing-md);
		border-top: 1px solid var(--borderColor);
		display: flex;
		justify-content: flex-end;
	}

	.cancelBtn {
		padding: var(--spacing-sm) var(--spacing-lg);
		background: transparent;
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		color: var(--textColor);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.cancelBtn:hover {
		background: var(--backgroundColor);
	}
</style>
