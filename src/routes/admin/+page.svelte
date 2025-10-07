<script lang="ts">
	const { data } = $props();

	const adminSections = [
		{
			title: 'Kids',
			description: 'Manage kids information and profiles',
			href: '/admin/kids',
			icon: '👧👦'
		},
		{
			title: 'Media',
			description: 'Upload and manage images with Cloudinary',
			href: '/admin/media',
			icon: '📸'
		},
		{
			title: 'Sponsors',
			description: 'Manage sponsor information and relationships',
			href: '/admin/sponsors',
			icon: '🤝'
		}
	];
</script>

<div class="dashboard">
	<div class="welcomeSection">
		<h2>Welcome back, {data.user?.name || 'Admin'}!</h2>
		<p class="welcomeText">Manage your Zim Updates content from here</p>
	</div>

	<div class="sectionGrid">
		{#each adminSections as section}
			<a href={section.href} class="sectionCard">
				<div class="cardIcon">{section.icon}</div>
				<h3>{section.title}</h3>
				<p>{section.description}</p>
				<span class="cardArrow">→</span>
			</a>
		{/each}
	</div>
</div>

<style>
	.dashboard {
		animation: cardsIn var(--transition-base);
	}

	.welcomeSection {
		margin-bottom: var(--spacing-2xl);
	}

	.welcomeSection h2 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.welcomeText {
		color: var(--textMuted);
		font-size: 1.1rem;
	}

	.sectionGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-lg);
	}

	.sectionCard {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: var(--spacing-xl);
		background: var(--surfaceColor);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
		color: var(--textColor);
		transition: all var(--transition-base);
		overflow: hidden;
	}

	.sectionCard::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background: var(--primaryColor);
		transform: scaleX(0);
		transition: transform var(--transition-base);
	}

	.sectionCard:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-md);
	}

	.sectionCard:hover::before {
		transform: scaleX(1);
	}

	.sectionCard:hover .cardArrow {
		transform: translateX(4px);
	}

	.cardIcon {
		font-size: 3rem;
		margin-bottom: var(--spacing-md);
	}

	.sectionCard h3 {
		color: var(--primaryColor);
		margin-bottom: var(--spacing-sm);
		font-size: 1.5rem;
	}

	.sectionCard p {
		color: var(--textMuted);
		margin-bottom: var(--spacing-md);
		flex-grow: 1;
	}

	.cardArrow {
		color: var(--primaryColor);
		font-size: 1.5rem;
		font-weight: bold;
		align-self: flex-end;
		transition: transform var(--transition-base);
	}
</style>
