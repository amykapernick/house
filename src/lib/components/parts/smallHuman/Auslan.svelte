<script lang="ts">
	import type { AuslanSign, SignStatus } from "$types/generated";
	import Card from "$parts/Card.svelte";
	import Modal from "$parts/Modal.svelte";
	import StatusSelect from "./StatusSelect.svelte";

	const {
		id,
		name,
		status,
		tip,
		reference,
		onStatusChange,
	}: AuslanSign & { onStatusChange?: (id: string, status: SignStatus) => void } = $props();

	const statusLabel: Record<SignStatus, string> = {
		introduce_next: 'Introduce',
		in_progress: 'In Progress',
		signing_occasionally: 'Sometimes',
		recognises: 'Recognises',
		coming_soon: 'Soon',
		done: 'Signing',
	}

	let videoOpen = $state(false);
</script>

<Card
	title={name}
	icon={onStatusChange ? undefined : status}
	IconComponent={onStatusChange ? StatusSelect : undefined}
	iconProps={onStatusChange ? { id, status, labels: statusLabel, onChange: onStatusChange } : undefined}
>
	{#if tip}
		<p>{tip}</p>
	{/if}
	{#if reference?.note}
		<p>{reference.note}</p>
	{/if}
	{#if !onStatusChange}
		<span class="sr-only">{statusLabel[status]}</span>
	{/if}
	{#if reference?.video}
		<button class="video_link" onclick={() => (videoOpen = true)}>
			Watch video
		</button>
	{/if}

	{#snippet footer()}
		{#if reference?.url}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- reference.url is the external Signbank dictionary page, not an internal route -->
			<a href={reference.url} target="_blank" class="sign_link">
				<span class="sr-only">Signbank page for {name}</span>
				<span aria-hidden="true">Signbank</span>
			</a>
		{/if}
	{/snippet}
</Card>

{#if reference?.video}
	<Modal bind:open={videoOpen} title={`${name} - Signbank video`}>
		<video src={reference.video} controls autoplay muted loop class="video">
			<track kind="captions" />
		</video>
	</Modal>
{/if}

<style>
	.video_link {
		border: none;
		background: none;
		color: inherit;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
		font: inherit;
	}

	.video {
		max-width: 100%;
		max-height: 70vh;
	}
</style>
