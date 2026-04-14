<script lang="ts">
	import { onMount } from 'svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state('');
	let loading = $state(false);

	onMount(() => {
		const message = new URLSearchParams(window.location.search).get('message');
		if (message === 'link') {
			error =
				'We could not find a sponsor profile linked to your login yet. Create an account here with the same email you use for sponsorship, or sign in after verifying your email.';
		}
	});

	async function handleSignup() {
		error = '';
		success = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/sponsor/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, password })
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				error = typeof result.error === 'string' ? result.error : 'Signup failed';
			} else {
				success =
					typeof result.message === 'string'
						? result.message
						: 'Check your email to verify your account.';
				name = '';
				email = '';
				password = '';
				confirmPassword = '';
			}
		} catch {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sponsor account — Zimbabwe Updates</title>
	<meta name="description" content="Create an account to view the children you sponsor." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="signupContainer">
	<div class="signupCard">
		<h1>Sponsor account</h1>
		<p class="subtitle">
			Use the <strong>same email address</strong> we have on file for your sponsorship. After you verify
			your email, we will connect your sponsored children to this account.
		</p>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSignup();
			}}
		>
			<div class="formGroup">
				<label for="name">Name</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					placeholder="Your name"
					disabled={loading}
					autocomplete="name"
				/>
			</div>

			<div class="formGroup">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					placeholder="you@example.com"
					disabled={loading}
					autocomplete="email"
				/>
			</div>

			<div class="formGroup">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					minlength="8"
					placeholder="At least 8 characters"
					disabled={loading}
					autocomplete="new-password"
				/>
			</div>

			<div class="formGroup">
				<label for="confirmPassword">Confirm password</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					required
					placeholder="Re-enter your password"
					disabled={loading}
					autocomplete="new-password"
				/>
			</div>

			{#if success}
				<div class="success" role="status">{success}</div>
			{/if}
			{#if error}
				<div class="error" role="alert">{error}</div>
			{/if}

			<button type="submit" disabled={loading} class="signupButton">
				{loading ? 'Creating account...' : 'Create sponsor account'}
			</button>
		</form>

		<p class="loginLink">
			Already have an account? <a href="/login">Sign in</a>
		</p>
		<p class="staffNote">
			Team member needing the admin site?
			<a href="/signup">Staff signup</a>
		</p>
	</div>
</div>

<style>
	.signupContainer {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: var(--spacing-lg);
		background: var(--backgroundColor);
	}

	.signupCard {
		background: var(--surfaceColor);
		padding: var(--spacing-2xl);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		width: 100%;
		max-width: 440px;
		animation: cardsIn var(--transition-base);
	}

	h1 {
		text-align: center;
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
	}

	.subtitle {
		text-align: center;
		color: var(--textMuted);
		margin-bottom: var(--spacing-xl);
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.formGroup {
		margin-bottom: var(--spacing-lg);
	}

	label {
		display: block;
		margin-bottom: var(--spacing-xs);
		font-weight: 500;
		color: var(--textColor);
	}

	input {
		width: 100%;
		padding: var(--spacing-md);
		border: 1px solid oklch(0.8 0.02 var(--hue));
		border-radius: var(--radius-md);
		font-size: 1rem;
		background: var(--backgroundColor);
		color: var(--textColor);
		transition: border-color var(--transition-base);
	}

	input:focus {
		outline: none;
		border-color: var(--primaryColor);
	}

	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.signupButton {
		width: 100%;
		padding: var(--spacing-md);
		background: var(--primaryColor);
		color: var(--contrastColor);
		border: none;
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.signupButton:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.signupButton:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		background: oklch(0.95 0.05 20);
		color: oklch(0.4 0.15 20);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-lg);
		border: 1px solid oklch(0.8 0.08 20);
	}

	.success {
		background: oklch(0.95 0.08 145);
		color: oklch(0.35 0.12 145);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-lg);
		border: 1px solid oklch(0.85 0.1 145);
	}

	.loginLink,
	.staffNote {
		text-align: center;
		margin-top: var(--spacing-lg);
		color: var(--textMuted);
		font-size: 0.9375rem;
	}

	.staffNote {
		margin-top: var(--spacing-md);
	}

	.loginLink a,
	.staffNote a {
		color: var(--primaryColor);
		text-decoration: none;
		font-weight: 600;
	}

	.loginLink a:hover,
	.staffNote a:hover {
		text-decoration: underline;
	}
</style>
