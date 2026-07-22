<script lang="ts">
	import { focusTimerState, notificationPermission, requestNotificationPermission } from '$utils/focusTimer';
	import FocusTimerActive from './FocusTimerActive.svelte';
	import FocusTimerSetup from './FocusTimerSetup.svelte';
	import Notification from '$img/icons/alarm-disable.svg?component';

	let {
		open = $bindable(false),
		class: className = '',
	}: {
		open?: boolean;
		class?: string;
	} = $props();

	let permission = $state(notificationPermission());

	async function enableNotifications() {
		permission = await requestNotificationPermission();
	}
</script>

{#if open || $focusTimerState}
	<div
		class="focus_timer {className}"
		class:has-active={!!$focusTimerState}
	>
		{#if $focusTimerState}
			<FocusTimerActive bind:open>
				{#if permission !== `granted` && permission !== `unsupported`}
					<button
						class="permission"
						onclick={enableNotifications}
					>
						<Notification />
						<span class="sr-only">Enable notifications</span>
					</button>
				{/if}
			</FocusTimerActive>
		{:else}
			<FocusTimerSetup>
				{#if permission !== `granted` && permission !== `unsupported`}
					<button
						class="permission"
						onclick={enableNotifications}
					>
						<Notification />
						<span class="sr-only">Enable notifications</span>
					</button>
				{/if}
			</FocusTimerSetup>
		{/if}
	</div>
{/if}

<style>
	.focus_timer {
		display: grid;
		position: fixed;
		z-index: 50;
		top: auto;
		right: max(20px, 5vw);
		bottom: 120px;
		grid-template-columns: auto 1fr auto;
		max-width: 400px;
		padding: 1em;
		border-radius: 1em;
		background: linear-gradient(var(--white_true), color-mix(in oklch, var(--background) 55%, var(--white_true)));
		box-shadow: var(--shadow_card);
		row-gap: 10px;

		&.has-active {
			right: 4em;
			bottom: 4.5em;
			padding: 0;
		}
	}
</style>
