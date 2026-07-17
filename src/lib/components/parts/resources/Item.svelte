<script lang="ts">
	import type { Resource } from '$types/resources';
	import OP from '$img/icons/1password.svg?component';

	let { id, name, url, icon, login, description, archived, image, brand, model, external, ipAddress, ramStorage, content, email, phone, lastUsed }: Omit<Resource, 'category'> = $props();

	// TODO: Date parsing, formatting and functions should always use date-fns and will be based on standard format of dates
	// TODO: Write date format lookup
	function formatDate(date?: string) {
		if (!date) return null;
		return new Date(date).toLocaleDateString('en-AU');
	}
</script>

<li data-archived={archived}>
	<h3 {id}>
		{#if url}
			<!-- url is an external resource link, not an internal route -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={url}
				target={url.startsWith('http') ? '_blank' : '_self'}
				rel="noreferrer"
			>
				{name}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{:else}
			{name}
		{/if}
	</h3>
	{#if icon && icon.startsWith('http')}
		<img
			class="icon"
			src={icon}
			alt={name}
		/>
	{/if}
	{#if description}
		<p class="desc">{description}</p>
	{/if}
	{#if login}
		<!-- login is an external 1Password link, not an internal route -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={login}
			target="_blank"
			rel="noreferrer"
			class="op"
		>
			<span class="sr-only">Login details for {name} on 1Password (access required)</span>
			<OP />
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
	{#if external}
		<!-- login is an external 1Password link, not an internal route -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={external}
			target="_blank"
			rel="noreferrer"
			class="ext"
		>
			<span class="sr-only">External listing for {name} </span>
			Link
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}

	<!-- Asset -->
	{#if image}
		<img
			class="photo"
			src={image}
			alt=""
		/>
	{/if}

	<dl class="meta">
		{#if brand}
			<dt>Brand</dt>
			<dd>{brand}</dd>
		{/if}
		{#if model}
			<dt>Model</dt>
			<dd>{model}</dd>
		{/if}
		{#if ipAddress}
			<dt>IP</dt>
			<dd>{ipAddress}</dd>
		{/if}
		{#if ramStorage}
			<dt>RAM/Storage</dt>
			<dd>{ramStorage}</dd>
		{/if}
		{#if email}
			<dt>Email</dt>
			<dd><a href={`mailto:${email}`}>{email}</a></dd>
		{/if}
		{#if phone}
			<dt>Phone</dt>
			<dd><a href={`tel:${phone.replace(' ', '')}`}>{phone}</a></dd>
		{/if}
		{#if lastUsed}
			<dt>Last Used</dt>
			<dd>{formatDate(lastUsed)}</dd>
		{/if}
	</dl>
	{#if content}
		<!-- TODO: rewrite this to not need the asset object -->
		<!-- <button type="button" class="notes" onclick={() => openNotes(asset)}>Notes</button> -->
	{/if}
	<!-- TODO: Unsure on this one -->
	<!-- {#if category?.length}
					<ul class="tags">
						{#each tags as tag (tag)}
							<li class="tag">{tag}</li>
						{/each}
					</ul>
				{/if} -->
</li>

<style>
	li {
		display: grid;
		position: relative;
		grid-template-areas:
			'icon title title title'
			'desc desc desc desc'
			'img img meta meta'
			'. . ext op';
		grid-template-columns: auto auto 1fr auto;
		grid-template-rows: auto 1fr auto;
		margin: 0;
		padding: 0.5em 1em;
		row-gap: 0.5em;

		&:not(:last-child) {
			border-bottom: inherit;
		}

		&:first-child {
			border-top-left-radius: inherit;
			border-top-right-radius: inherit;
		}

		&:last-child {
			border-bottom-right-radius: inherit;
			border-bottom-left-radius: inherit;
		}

		&:has(h3 a:hover) {
			background: linear-gradient(155deg, rgb(53 71 140), rgb(26 36 71));
			color: var(--navy_text);
		}

		&:has(h3 a:focus) {
			outline: 2px dotted var(--green);
		}

		&[data-archived='true'] {
			opacity: 0.5;
		}
	}

	h3 {
		grid-area: title;
		margin: 0;

		& a {
			&::before {
				content: '';
				position: absolute;
				inset: 0;
			}

			&:hover {
				text-decoration: none;
			}

			&:focus {
				outline: none;
			}
		}
	}

	.icon {
		grid-area: icon;
		width: auto;
		max-width: 2em;
		height: 2em;
		margin-right: 1em;
	}

	.op {
		z-index: 5;
		grid-area: op;
	}

	.ext {
		grid-area: ext;
		justify-self: end;
	}

	.desc {
		grid-area: desc;
		margin: 0;
		font-size: 0.8em;
	}

	.meta {
		display: grid;
		grid-area: meta;
		grid-template-columns: auto 1fr;
		align-self: start;
		margin: 0;
		font-size: 0.85em;
		gap: 0.2em 0.5em;

		& dt {
			font-weight: 600;
		}

		& dd {
			margin: 0;
		}
	}

	.photo {
		grid-area: img;
		align-self: start;
		max-width: 150px;
		max-height: 150px;
		margin-right: 1em;
	}
</style>
