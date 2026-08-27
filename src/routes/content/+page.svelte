<script lang="ts">
	import ContentEntries from '$components/partials/content/ContentEntries/index.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import Title from '$parts/Title/index.svelte';
</script>

<svelte:head>
	<title>{getPageTitle(`Content`)}</title>
</svelte:head>

<Title>Content</Title>
<ContentEntries />
