<script lang="ts">
	import { signIn } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin() {
		error = '';
		loading = true;

		try {
			const result = await signIn.email({
				email,
				password
			});

			if (result.error) {
				error = result.error.message || 'Login failed';
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

<div class="loginContainer">
	<div class="loginCard">
		<h1>Admin Login</h1>
		<p class="subtitle">Sign in to access the admin panel</p>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleLogin();
			}}
		>
			<div class="formGroup">
				<label for="email">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					placeholder="admin@example.com"
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
					placeholder="Enter your password"
					disabled={loading}
				/>
			</div>

			{#if error}
				<div class="error" role="alert">{error}</div>
			{/if}

			<button type="submit" disabled={loading} class="loginButton">
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<p class="signupLink">
			Don't have an account? <a href="/signup">Sign up</a>
		</p>
	</div>
</div>

<style>
	.loginContainer {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: var(--spacing-lg);
		background: var(--backgroundColor);
	}

	.loginCard {
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

	.loginButton {
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

	.loginButton:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.loginButton:disabled {
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

	.signupLink {
		text-align: center;
		margin-top: var(--spacing-lg);
		color: var(--textMuted);
	}

	.signupLink a {
		color: var(--primaryColor);
		text-decoration: none;
		font-weight: 600;
	}

	.signupLink a:hover {
		text-decoration: underline;
	}
</style>
