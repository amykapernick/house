<script lang="ts">
	import ContentEntries from '$components/partials/content/ContentEntries.svelte';
	import { getPageTitle } from '$utils/pageTitle';
</script>

<svelte:head>
	<title>{getPageTitle(`Content Archive`)}</title>
</svelte:head>

<h1>Archive</h1>
<ContentEntries archived />
