<script lang="ts">
	import { focusTimerState, notificationPermission, requestNotificationPermission } from '$utils/focusTimer';
	import FocusTimerActive from '../FocusTimerActive/index.svelte';
	import FocusTimerSetup from '../FocusTimerSetup/index.svelte';
	import Notification from '$img/icons/alarm-disable.svg?component';
	import styles from './index.module.css';

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
		class={[styles.focus_timer, className, !!$focusTimerState && styles['has-active']]}
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
