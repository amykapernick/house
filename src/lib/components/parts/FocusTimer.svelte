<script lang="ts">
	import { focusTimerState, notificationPermission,
		requestNotificationPermission, } from '$utils/focusTimer';
	import FocusTimerActive from './FocusTimerActive.svelte';
	import FocusTimerSetup from './FocusTimerSetup.svelte';
	import Notification from '$img/icons/bell-plus.svg?component'

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
<div class="focus_timer {className}" class:has-active={!!$focusTimerState}>
	
	{#if $focusTimerState}
		<FocusTimerActive bind:open>
{#if permission !== `granted` && permission !== `unsupported`}
		<button class="permission" onclick={enableNotifications}>
			<Notification />
			<span class="sr-only">Enable notifications</span>
		</button>
	{/if}
		</FocusTimerActive>
	{:else}
		<FocusTimerSetup>
			{#if permission !== `granted` && permission !== `unsupported`}
		<button class="permission" onclick={enableNotifications}>
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
		position: fixed;
		right: max(20px, 5vw);
		bottom: 120px;
		top: auto;
		z-index: 50;
		background: linear-gradient(var(--white_true), color-mix(in oklch, var(--background) 55%, var(--white_true)));
		box-shadow: rgba(13, 13, 13, 0.04) 0px 1px 2px, rgba(95, 65, 50, 0.07) 0px 3px 10px;
		display: grid;
		grid-template-columns: auto 1fr auto;
		row-gap: 10px;
		max-width: 400px;
		padding: 1em;
		border-radius: 1em;

		&.has-active {
			bottom: 4.5em;
			right: 4em;
			padding: 0;
		}
	}

	.permission {
		
	}
</style>
