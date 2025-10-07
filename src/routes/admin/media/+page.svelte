<script lang="ts">
	import CloudinaryUpload from '$lib/components/CloudinaryUpload.svelte';
	import { Image } from '$lib';

	let uploadedImages = $state<Array<{ publicId: string; url: string }>>([]);
	let existingImages = $state<
		Array<{ publicId: string; url: string; width: number; height: number }>
	>([]);
	let loading = $state(true);

	async function loadExistingImages() {
		try {
			const response = await fetch('/api/cloudinary/images?folder=zim-admin');
			if (response.ok) {
				const data = await response.json();
				existingImages = data.images;
			}
		} catch (error) {
			console.error('Error loading images:', error);
		} finally {
			loading = false;
		}
	}

	function handleUploadSuccess(publicId: string, url: string) {
		uploadedImages = [...uploadedImages, { publicId, url }];
		loadExistingImages();
	}

	$effect(() => {
		loadExistingImages();
	});
</script>

<div class="pageWrapper">
	<h1>Upload Images to Cloudinary</h1>

	<CloudinaryUpload folder="zim-admin" tags={['demo']} onSuccess={handleUploadSuccess} />

	{#if uploadedImages.length > 0}
		<section class="gallery" aria-label="Uploaded images">
			<h2>Just Uploaded</h2>
			<div class="grid">
				{#each uploadedImages as img (img.publicId)}
					<div class="imageCard">
						<Image source={img.publicId} altTag="Image from zim-admin" width="400" />
						<p class="publicId">{img.publicId}</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<section class="gallery" aria-label="All images in zim-admin folder">
		<h2>All Images in zim-admin Folder</h2>
		{#if loading}
			<p class="loadingText">Loading images...</p>
		{:else if existingImages.length > 0}
			<div class="grid">
				{#each existingImages as img (img.publicId)}
					<div class="imageCard">
						<div class="imageContainer">
							<Image source={img.publicId} altTag="Image from zim-admin" width="200" />
						</div>
						<p class="publicId">{img.publicId}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="emptyText">No images found in zim-admin folder</p>
		{/if}
	</section>
</div>

<style>
	.gallery {
		margin-top: var(--spacing-xl);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--spacing-lg);
		animation: cardsIn var(--transition-slow);
	}

	.imageCard {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		background-color: var(--surfaceColor);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
	}

	.imageCard:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.imageContainer {
		width: 100%;
		aspect-ratio: 3/4;
		overflow: hidden;
	}

	.publicId {
		font-size: 0.875rem;
		color: var(--textMuted);
		word-break: break-all;
		margin: 0;
	}

	.loadingText,
	.emptyText {
		color: var(--textMuted);
		font-style: italic;
	}
</style>
