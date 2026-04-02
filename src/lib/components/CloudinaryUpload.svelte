<script lang="ts">
	import { getFullPublicId, sanitizePublicId } from '$lib/cloudinaryPublicId';

	interface Props {
		folder?: string;
		tags?: string[];
		onSuccess?: (publicId: string, url: string) => void;
	}

	const { folder, tags, onSuccess }: Props = $props();

	let uploading = $state(false);
	let error = $state<string | null>(null);
	let warning = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let imageName = $state('');
	let existingPublicIds = $state<string[]>([]);
	let fileInput: HTMLInputElement;

	function fullPublicIdForCompare(baseName: string): string {
		return getFullPublicId(baseName, folder);
	}

	function collidesWithExisting(baseName: string): boolean {
		const target = fullPublicIdForCompare(baseName).toLowerCase();
		return existingPublicIds.some((id) => id.toLowerCase() === target);
	}

	async function loadExistingPublicIds() {
		const folderParam = folder ? `?folder=${encodeURIComponent(folder)}` : '';
		const response = await fetch(`/api/cloudinary/images${folderParam}`);
		if (!response.ok) return;
		const data = await response.json();
		existingPublicIds = (data.images || []).map((img: { publicId: string }) => img.publicId);
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		selectedFile = file;
		imageName = sanitizePublicId(file.name);
		error = null;
		warning = null;

		await loadExistingPublicIds();
		if (collidesWithExisting(imageName)) {
			warning =
				'An image with this name already exists in Cloudinary. Rename it before uploading.';
		}
	}

	async function uploadSelectedFile() {
		if (!selectedFile) {
			error = 'Please select an image first';
			return;
		}
		if (!imageName.trim()) {
			error = 'Please enter a valid image name';
			return;
		}

		if (collidesWithExisting(imageName)) {
			warning =
				'This image name already exists. Please change the name before uploading.';
			return;
		}

		const canonicalPublicId = sanitizePublicId(imageName);
		if (!canonicalPublicId) {
			error = 'Please enter a valid image name';
			return;
		}

		uploading = true;
		error = null;
		warning = null;

		try {
			// Get signed upload params from our server
			const signResponse = await fetch('/api/cloudinary/sign-upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ folder, tags, public_id: canonicalPublicId })
			});

			if (!signResponse.ok) {
				let msg = 'Failed to get upload signature';
				try {
					const errBody = await signResponse.json();
					if (errBody?.message && typeof errBody.message === 'string') {
						msg = errBody.message;
					}
				} catch {
					/* use default */
				}
				throw new Error(msg);
			}

			const { signature, timestamp, apiKey, cloudName } = await signResponse.json();

			// Upload to Cloudinary
			const formData = new FormData();
			formData.append('file', selectedFile);
			formData.append('signature', signature);
			formData.append('timestamp', timestamp.toString());
			formData.append('api_key', apiKey);
			if (folder) formData.append('folder', folder);
			if (tags && tags.length) formData.append('tags', tags.join(','));
			formData.append('public_id', canonicalPublicId);

			const uploadResponse = await fetch(
				`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
				{
					method: 'POST',
					body: formData
				}
			);

			if (!uploadResponse.ok) throw new Error('Upload failed');

			const result = await uploadResponse.json();
			if (onSuccess) onSuccess(result.public_id, result.secure_url);

			// Reset input
			if (fileInput) fileInput.value = '';
			selectedFile = null;
			imageName = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="uploadContainer">
	<label for="cloudinary-upload" class="uploadLabel">
		{#if uploading}
			<span class="uploadText">Uploading...</span>
		{:else}
			<span class="uploadText">Choose image to upload</span>
		{/if}
	</label>
	<input
		id="cloudinary-upload"
		type="file"
		accept="image/*"
		onchange={handleFileSelect}
		disabled={uploading}
		bind:this={fileInput}
	/>
	{#if selectedFile}
		<div class="nameEditor">
			<label for="imageName">Image name</label>
			<input id="imageName" type="text" bind:value={imageName} disabled={uploading} />
			<button type="button" class="uploadButton" onclick={uploadSelectedFile} disabled={uploading}>
				{uploading ? 'Uploading...' : 'Upload image'}
			</button>
		</div>
	{/if}
	{#if warning}
		<p class="warning">{warning}</p>
	{/if}
	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	.uploadContainer {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.uploadLabel {
		display: inline-block;
		padding: var(--spacing-md) var(--spacing-xl);
		background-color: var(--primaryColor);
		color: var(--contrastColor);
		border-radius: var(--radius-md);
		cursor: pointer;
		text-align: center;
		transition: all var(--transition-fast);
		box-shadow: var(--shadow-sm);
		font-weight: 500;
	}

	.uploadLabel:hover {
		opacity: 0.9;
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.uploadLabel:active {
		transform: translateY(0);
	}

	input[type='file'] {
		display: none;
	}

	.uploadText {
		font-weight: 500;
	}

	.nameEditor {
		display: grid;
		gap: var(--spacing-xs);
	}

	.nameEditor input {
		padding: var(--spacing-sm);
		border: 1px solid var(--borderColor);
		border-radius: var(--radius-sm);
		background: var(--backgroundColor);
		color: var(--textColor);
	}

	.uploadButton {
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		border-radius: var(--radius-sm);
		background: var(--primaryColor);
		color: var(--contrastColor);
		cursor: pointer;
		font-weight: 600;
	}

	.warning {
		color: oklch(0.45 0.14 80);
		font-size: 0.875rem;
		margin: 0;
	}

	.error {
		color: var(--errorColor);
		font-size: 0.875rem;
		margin: 0;
	}
</style>
