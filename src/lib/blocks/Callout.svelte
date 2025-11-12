<script lang="ts">
	import type { Block } from '$lib/server/updates';

	interface Props extends Block {
		message?: string;
		type?: 'info' | 'warning' | 'success' | 'error';
	}

	let { message, type = 'info' }: Props = $props();
	const calloutType = type;
</script>

<div class="callout {calloutType}">
	<p>{message}</p>
</div>

<style>
	.callout {
		padding: var(--spacing-lg);
		border-radius: var(--radius-md);
		border-left: 4px solid;
		margin: var(--spacing-xl) 0;
	}

	.callout.info {
		background: oklch(0.95 0.05 240);
		border-color: oklch(0.6 0.15 240);
		color: oklch(0.3 0.1 240);
	}

	.callout.warning {
		background: oklch(0.95 0.05 60);
		border-color: oklch(0.6 0.15 60);
		color: oklch(0.3 0.1 60);
	}

	.callout.success {
		background: oklch(0.95 0.05 140);
		border-color: oklch(0.6 0.15 140);
		color: oklch(0.3 0.1 140);
	}

	.callout.error {
		background: oklch(0.95 0.05 20);
		border-color: oklch(0.6 0.15 20);
		color: oklch(0.3 0.1 20);
	}

	.callout p {
		margin: 0;
		line-height: 1.6;
	}
</style>
