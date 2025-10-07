<script lang="ts">
	import { signUp } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSignup() {
		error = '';

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
			const result = await signUp.email({
				email,
				password,
				name
			});

			if (result.error) {
				error = result.error.message || 'Signup failed';
			} else {
				goto('/admin');
			}
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="signupContainer">
	<div class="signupCard">
		<h1>Create Account</h1>
		<p class="subtitle">Sign up to access the admin panel</p>

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
				/>
			</div>

			<div class="formGroup">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					placeholder="your@email.com"
					disabled={loading}
				/>
			</div>

			<div class="formGroup">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					placeholder="At least 8 characters"
					disabled={loading}
				/>
			</div>

			<div class="formGroup">
				<label for="confirmPassword">Confirm Password</label>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					required
					placeholder="Re-enter your password"
					disabled={loading}
				/>
			</div>

			{#if error}
				<div class="error" role="alert">{error}</div>
			{/if}

			<button type="submit" disabled={loading} class="signupButton">
				{loading ? 'Creating account...' : 'Create Account'}
			</button>
		</form>

		<p class="loginLink">
			Already have an account? <a href="/login">Sign in</a>
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
		max-width: 400px;
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

	.loginLink {
		text-align: center;
		margin-top: var(--spacing-lg);
		color: var(--textMuted);
	}

	.loginLink a {
		color: var(--primaryColor);
		text-decoration: none;
		font-weight: 600;
	}

	.loginLink a:hover {
		text-decoration: underline;
	}
</style>
