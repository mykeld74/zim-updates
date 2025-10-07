<script lang="ts">
	interface Props {
		folder?: string;
		tags?: string[];
		onSuccess?: (publicId: string, url: string) => void;
	}

	const { folder, tags, onSuccess }: Props = $props();

	let uploading = $state(false);
	let error = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	async function handleUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		uploading = true;
		error = null;

		try {
			// Get signed upload params from our server
			const signResponse = await fetch('/api/cloudinary/sign-upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ folder, tags })
			});

			if (!signResponse.ok) throw new Error('Failed to get upload signature');

			const { signature, timestamp, apiKey, cloudName } = await signResponse.json();

			// Upload to Cloudinary
			const formData = new FormData();
			formData.append('file', file);
			formData.append('signature', signature);
			formData.append('timestamp', timestamp.toString());
			formData.append('api_key', apiKey);
			if (folder) formData.append('folder', folder);
			if (tags && tags.length) formData.append('tags', tags.join(','));

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
		onchange={handleUpload}
		disabled={uploading}
		bind:this={fileInput}
	/>
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

	.error {
		color: var(--errorColor);
		font-size: 0.875rem;
		margin: 0;
	}
</style>
