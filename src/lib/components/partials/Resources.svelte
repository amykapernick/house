<script lang="ts">
	import type { Resource } from '$types/resources';

	let { resources }: { resources: Resource[] } = $props();

	let grouped = $derived.by(() => {
		const groups: Record<string, Resource[]> = {};
		resources.forEach((resource) => {
			const category = resource?.category ?? 'Other';
			if (!groups[category]) groups[category] = [];
			groups[category].push(resource);
		});
		return groups;
	});
</script>

<div class="resources">
	{#each Object.entries(grouped) as [category, categoryResources] (category)}
		<section class="category">
			<h2>{category}</h2>
			<ul class="list">
				{#each categoryResources as { name, url, id, icon, login, description, archived } (id)}
					<li class="item" data-archived={archived}>
						<!-- url is an external resource link, not an internal route -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							class="title"
							href={url}
							target={url?.startsWith('http') ? '_blank' : '_self'}
							rel="noreferrer"
						>
							{name}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
								<polyline points="15 3 21 3 21 9" />
								<line x1="10" y1="14" x2="21" y2="3" />
							</svg>
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
						{#if icon && icon.startsWith('http')}
							<img class="icon" src={icon} alt={name} />
						{/if}
						{#if description}
							<p>{description}</p>
						{/if}
						{#if login}
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- login is an external 1Password link, not an internal route -->
							<a href={login} target="_blank" rel="noreferrer" class="login">
								<span class="sr-only">Login details for {name} on 1Password (access required)</span>
								🔐
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.resources {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}

	.category {
		flex: 1 1 auto;
		padding: 20px;
		border-radius: 0.5em;
		background: var(--navy);

		& h2 {
			margin-top: 0;
			color: var(--navy_text);
		}
	}

	.list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 10px;
	}

	.item {
		display: grid;
		grid-template-areas: 'icon title login' 'icon description description';
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto 1fr;
		margin: 0;
		padding: 10px;
		gap: 5px 10px;
		border-radius: 0.5em;
		background: var(--orange);
		color: var(--orange_text);

		&[data-archived='true'] {
			opacity: 0.5;
		}

		&:nth-child(5n - 1) {
			background: var(--green);
			color: var(--green_text);
		}

		&:nth-child(5n - 2) {
			background: var(--blue);
			color: var(--blue_text);
		}

		&:nth-child(5n - 3) {
			background: var(--pink);
			color: var(--pink_text);
		}

		&:nth-child(5n - 4) {
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}

		& p {
			grid-area: description;
			margin: 0;
		}
	}

	.title {
		display: flex;
		grid-area: title;
		align-items: center;
		justify-content: space-between;
		color: inherit;
		font-size: 1.2em;
		font-weight: 600;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}

		& svg {
			margin-left: 1ch;
		}
	}

	.icon {
		grid-area: icon;
		width: 3em;
		height: 3em;
		object-fit: contain;
	}

	.login {
		display: flex;
		grid-area: login;
		align-items: center;
	}
</style>
