<script lang="ts">
	import { goto } from '$app/navigation';
	import { AdminImage } from '$lib';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';

	let title = $state('');
	let slug = $state('');
	let excerpt = $state('');
	let content = $state('');
	let featuredImage = $state('');
	let author = $state('');
	let status = $state<'draft' | 'published'>('draft');

	let saving = $state(false);
	let errorMessage = $state<string | null>(null);
	let showImageUpload = $state(false);
	let autoSlug = $state(true);

	// Auto-generate slug from title
	$effect(() => {
		if (autoSlug && title) {
			slug = title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
				.substring(0, 100);
		}
	});

	function handleSlugChange() {
		autoSlug = false;
	}

	async function handleSave(publish: boolean = false) {
		if (!title.trim()) {
			errorMessage = 'Title is required';
			return;
		}

		saving = true;
		errorMessage = null;

		try {
			const response = await fetch('/api/updates', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					slug: slug.trim() || undefined,
					excerpt: excerpt.trim() || undefined,
					content: content ? { root: { children: [{ type: 'html', value: content }] } } : undefined,
					featuredImage: featuredImage || undefined,
					author: author.trim() || undefined,
					status: publish ? 'published' : status
				})
			});

			const result = await response.json();

			if (response.ok) {
				goto(`/admin/updates/${result.update.id}`);
			} else {
				errorMessage = result.error || 'Failed to create update';
			}
		} catch (err) {
			console.error('Error saving:', err);
			errorMessage = 'An error occurred while saving';
		} finally {
			saving = false;
		}
	}

	function handleImageUpload(publicId: string) {
		featuredImage = publicId;
		showImageUpload = false;
	}

	function removeImage() {
		featuredImage = '';
	}
</script>

<div class="editorPage">
	<div class="editorHeader">
		<a href="/admin/updates" class="backLink">← Back to Updates</a>
		<h1>Create New Update</h1>
	</div>

	{#if errorMessage}
		<div class="errorBanner" role="alert">
			<p>{errorMessage}</p>
			<button onclick={() => (errorMessage = null)} class="dismissButton">Dismiss</button>
		</div>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
	>
		<div class="editorLayout">
			<div class="mainColumn">
				<div class="formGroup">
					<label for="title">Title *</label>
					<input
						type="text"
						id="title"
						bind:value={title}
						required
						placeholder="Enter update title"
						class="titleInput"
					/>
				</div>

				<div class="formGroup">
					<label for="slug">Slug</label>
					<div class="slugInput">
						<span class="slugPrefix">/updates/</span>
						<input
							type="text"
							id="slug"
							bind:value={slug}
							oninput={handleSlugChange}
							placeholder="auto-generated-from-title"
						/>
					</div>
				</div>

				<div class="formGroup">
					<label for="excerpt">Excerpt</label>
					<textarea
						id="excerpt"
						bind:value={excerpt}
						placeholder="Brief summary of the update (shown in listings)"
						rows="3"
					></textarea>
				</div>

				<div class="formGroup">
					<label for="content-editor">Content</label>
					<RichTextEditor
						{content}
						onchange={(html) => (content = html)}
						placeholder="Write your update content here..."
					/>
				</div>
			</div>

			<div class="sideColumn">
				<div class="sideCard">
					<h3>Publish</h3>
					<div class="formGroup">
						<label for="status">Status</label>
						<select id="status" bind:value={status}>
							<option value="draft">Draft</option>
							<option value="published">Published</option>
						</select>
					</div>

					<div class="publishActions">
						<button type="submit" class="saveButton" disabled={saving}>
							{saving ? 'Saving...' : 'Save Draft'}
						</button>
						<button
							type="button"
							class="publishButton"
							disabled={saving}
							onclick={() => handleSave(true)}
						>
							{saving ? 'Publishing...' : 'Save & Publish'}
						</button>
					</div>
				</div>

				<div class="sideCard">
					<h3>Featured Image</h3>
					{#if featuredImage}
						<div class="imagePreview">
							<AdminImage source={featuredImage} altTag="Featured image" width="300" />
							<button type="button" class="removeImageBtn" onclick={removeImage}>Remove</button>
							<button type="button" class="changeImageBtn" onclick={() => (showImageUpload = true)}>
								Change Image
							</button>
						</div>
					{:else if showImageUpload}
						<ImagePicker
							folder="zim-admin/updates"
							tags={['update-featured']}
							onSelect={handleImageUpload}
							onCancel={() => (showImageUpload = false)}
						/>
					{:else}
						<button type="button" class="addImageBtn" onclick={() => (showImageUpload = true)}>
							+ Add Featured Image
						</button>
					{/if}
				</div>

				<div class="sideCard">
					<h3>Author</h3>
					<div class="formGroup">
						<input type="text" bind:value={author} placeholder="Author name (optional)" />
					</div>
				</div>
			</div>
		</div>
	</form>
</div>

<style>
	.editorPage {
		animation: cardsIn var(--transition-base);
		max-width: 1400px;
		margin: 0 auto;
	}

	.editorHeader {
		margin-bottom: var(--spacing-xl);
	}

	.backLink {
		display: inline-block;
		color: var(--primaryColor);
		text-decoration: none;
		margin-bottom: var(--spacing-md);
		font-weight: 500;
		transition: transform var(--transition-base);
	}

	.backLink:hover {
		transform: translateX(-4px);
	}

	h1 {
		color: var(--primaryColor);
		margin: 0;
		font-size: clamp(1.5rem, 3vw, 2rem);
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

	.dismissButton {
		background: transparent;
		border: 1px solid currentColor;
		color: inherit;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.editorLayout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: var(--spacing-xl);
	}

	.mainColumn {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.sideColumn {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.sideCard {
		background: var(--surfaceColor);
		padding: var(--spacing-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.sideCard h3 {
		color: var(--primaryColor);
		margin: 0 0 var(--spacing-md);
		font-size: 1.1rem;
	}

	.formGroup {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.formGroup label {
		font-weight: 600;
		color: var(--textColor);
	}

	.formGroup input,
	.formGroup textarea,
	.formGroup select {
		padding: var(--spacing-sm);
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: var(--backgroundColor);
		color: var(--textColor);
	}

	.titleInput {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.slugInput {
		display: flex;
		align-items: center;
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--backgroundColor);
	}

	.slugPrefix {
		padding: var(--spacing-sm);
		background: var(--surfaceColor);
		color: var(--textMuted);
		font-size: 0.9rem;
		border-right: 1px solid var(--borderColor);
	}

	.slugInput input {
		border: none;
		flex: 1;
	}

	.publishActions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	.saveButton,
	.publishButton {
		padding: var(--spacing-sm) var(--spacing-lg);
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.saveButton {
		background: var(--surfaceColor);
		color: var(--textColor);
		border: 1px solid var(--borderColor);
	}

	.publishButton {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.saveButton:hover:not(:disabled),
	.publishButton:hover:not(:disabled) {
		transform: translateY(-2px);
	}

	.saveButton:disabled,
	.publishButton:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.imagePreview {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.imagePreview :global(img) {
		width: 100%;
		border-radius: var(--radius-md);
	}

	.removeImageBtn {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		color: oklch(0.5 0.15 20);
		border: 1px solid oklch(0.5 0.15 20);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.removeImageBtn:hover {
		background: oklch(0.5 0.15 20);
		color: white;
	}

	.changeImageBtn {
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		color: var(--primaryColor);
		border: 1px solid var(--primaryColor);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.changeImageBtn:hover {
		background: var(--primaryColor);
		color: var(--contrastColor);
	}

	.addImageBtn {
		width: 100%;
		padding: var(--spacing-md);
		background: var(--backgroundColor);
		border: 2px dashed var(--borderColor);
		border-radius: var(--radius-md);
		color: var(--textMuted);
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.addImageBtn:hover {
		border-color: var(--primaryColor);
		color: var(--primaryColor);
	}

	@media (max-width: 900px) {
		.editorLayout {
			grid-template-columns: 1fr;
		}

		.sideColumn {
			order: -1;
		}
	}
</style>
