<script lang="ts">
	import { signIn, sendVerificationEmail, getSession } from '$lib/auth-client';
	import { getEmailVerificationCallbackUrl } from '$lib/emailVerification';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let pendingMessage = $state('');
	let successMessage = $state('');
	let nextPath = $state<string | null>(null);
	let resendLoading = $state(false);
	let resendNotice = $state('');

	const showResendVerification = $derived(
		error.toLowerCase().includes('not verified') || error.toLowerCase().includes('verify your email')
	);

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const message = urlParams.get('message');
		const verifyErr = urlParams.get('error');

		if (verifyErr === 'invalid_token') {
			error =
				'That verification link is invalid. Sign in with your password and we can send a new verification email.';
		} else if (verifyErr === 'token_expired') {
			error =
				'That verification link has expired. Sign in with your password and we will send a fresh verification email.';
		} else if (verifyErr === 'user_not_found') {
			error = 'We could not match that verification link to an account.';
		} else if (verifyErr) {
			error = 'Email verification did not complete. Try signing in to get a new link.';
		}

		if (message === 'pending') {
			pendingMessage =
				'Please verify your email to continue. If you are a sponsor, sign in with the email you use for sponsorship — you may still have access under “My sponsorship” after verification.';
		}
		if (message === 'verify-staff') {
			pendingMessage =
				'We sent a verification link to your email. Open it to confirm your address, then sign in here.';
		}
		if (message === 'email-verified') {
			successMessage = 'Your email is verified.';
			void finishPostVerificationRedirect(urlParams);
		}
		nextPath = urlParams.get('next');
	});

	async function finishPostVerificationRedirect(urlParams: URLSearchParams) {
		const { data } = await getSession();
		if (!data?.user) return;

		const next = urlParams.get('next');
		if (next && next.startsWith('/') && !next.startsWith('//')) {
			await goto(next);
			return;
		}
		const targetResponse = await fetch('/api/me/redirect-target', { credentials: 'include' });
		const targetData = await targetResponse.json().catch(() => ({}));
		const dest = typeof targetData.redirect === 'string' ? targetData.redirect : '/';
		if (dest !== '/login' && !dest.startsWith('/login?')) {
			await goto(dest);
		}
	}

	async function handleResendVerification() {
		resendNotice = '';
		if (!email.trim()) {
			resendNotice = 'Enter your email above first.';
			return;
		}
		resendLoading = true;
		try {
			const result = await sendVerificationEmail({
				email: email.trim(),
				callbackURL: getEmailVerificationCallbackUrl()
			});
			if (result.error) {
				resendNotice = result.error.message || 'Could not send email.';
			} else {
				resendNotice = 'Check your inbox for a new verification link.';
			}
		} catch {
			resendNotice = 'Could not send email. Try again later.';
		} finally {
			resendLoading = false;
		}
	}

	async function handleLogin() {
		error = '';
		pendingMessage = '';
		successMessage = '';
		resendNotice = '';
		loading = true;

		try {
			const result = await signIn.email({
				email,
				password,
				callbackURL: getEmailVerificationCallbackUrl()
			});

			if (result.error) {
				error = result.error.message || 'Login failed';
			} else if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
				goto(nextPath);
			} else {
				const targetResponse = await fetch('/api/me/redirect-target', { credentials: 'include' });
				const targetData = await targetResponse.json().catch(() => ({}));
				const fallback =
					typeof targetData.redirect === 'string' ? targetData.redirect : '/login?message=pending';
				goto(fallback);
			}
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Zimbabwe Updates</title>
	<meta name="description" content="Sign in to the Zimbabwe Updates sponsor portal or admin site." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="loginContainer">
	<div class="loginCard">
		<h1>Sign in</h1>
		<p class="subtitle">Sponsor portal or admin access (after approval)</p>

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

			{#if successMessage}
				<div class="success" role="status">{successMessage}</div>
			{/if}

			{#if pendingMessage}
				<div class="pending" role="alert">{pendingMessage}</div>
			{/if}

			{#if error}
				<div class="error" role="alert">{error}</div>
			{/if}

			{#if showResendVerification}
				<div class="resendBlock">
					<p class="resendHint">We can send another verification link to the address above.</p>
					<button
						type="button"
						class="resendButton"
						disabled={resendLoading}
						onclick={() => handleResendVerification()}
					>
						{resendLoading ? 'Sending…' : 'Resend verification email'}
					</button>
					{#if resendNotice}
						<p class="resendNotice" role="status">{resendNotice}</p>
					{/if}
				</div>
			{/if}

			<button type="submit" disabled={loading} class="loginButton">
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<p class="signupLink">
			Sponsor? <a href="/sponsor/signup">Create a sponsor account</a>
		</p>
		<p class="signupLink secondary">
			Staff admin access? <a href="/signup">Request staff signup</a>
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

	.success {
		background: oklch(0.95 0.08 145);
		color: oklch(0.35 0.12 145);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-lg);
		border: 1px solid oklch(0.85 0.1 145);
	}

	.pending {
		background: oklch(0.95 0.1 100);
		color: oklch(0.4 0.15 100);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-lg);
		border: 1px solid oklch(0.8 0.1 100);
	}

	.resendBlock {
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		background: oklch(from var(--surfaceColor) l c h / 0.9);
		border: 1px solid oklch(from var(--textMuted) l c h / 0.25);
	}

	.resendHint {
		margin: 0 0 var(--spacing-sm);
		font-size: 0.9375rem;
		color: var(--textMuted);
		line-height: 1.4;
	}

	.resendButton {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		color: var(--primaryColor);
		border: 2px solid var(--primaryColor);
		border-radius: var(--radius-md);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition-base);
	}

	.resendButton:hover:not(:disabled) {
		background: oklch(from var(--primaryColor) l c h / 0.08);
	}

	.resendButton:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.resendNotice {
		margin: var(--spacing-sm) 0 0;
		font-size: 0.875rem;
		color: var(--textMuted);
	}

	.signupLink {
		text-align: center;
		margin-top: var(--spacing-lg);
		color: var(--textMuted);
	}

	.signupLink.secondary {
		margin-top: var(--spacing-sm);
		font-size: 0.9375rem;
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
