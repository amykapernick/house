<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import type { Resource } from '$types/resources';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import OP from '$img/icons/1password.svg?component';
	import styles from './index.module.css';

	let { id, name, url, icon, login, description, archived, image, brand, model, external, ipAddress, ramStorage, content, email, phone, lastUsed }: Omit<Resource, 'category'> = $props();

	function formatDate(date?: string) {
		if (!date) return null;
		return format(parseISO(date), DATE_FORMATS.full);
	}
</script>

<li class={styles.root} data-archived={archived}>
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
			class={styles.icon}
			src={icon}
			alt={name}
		/>
	{/if}
	{#if description}
		<p class={styles.desc}>{description}</p>
	{/if}
	{#if login}
		<!-- login is an external 1Password link, not an internal route -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={login}
			target="_blank"
			rel="noreferrer"
			class={styles.op}
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
			class={styles.ext}
		>
			<span class="sr-only">External listing for {name} </span>
			Link
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}

	<!-- Asset -->
	{#if image}
		<img
			class={styles.photo}
			src={image}
			alt=""
		/>
	{/if}

	<dl class={styles.meta}>
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
