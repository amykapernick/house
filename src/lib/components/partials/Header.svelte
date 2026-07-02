<script lang="ts">
	import MainMenu from '$parts/MainMenu.svelte';
	import { isAuthenticated, clerk } from '$lib/auth';
	import type { MenuItem } from '$types/global';
	import Dashboard from '$img/icons/layout-11.svg?component';
	import Archive from '$img/icons/archive-drawer.svg?component';
	import List from '$img/icons/list.svg?component';
	import Calendar from '$img/icons/calendar-date.svg?component';
	import Plan from '$img/icons/diet-plan.svg?component';
	import Cart from '$img/icons/cart.svg?component';
	import Recipes from '$img/icons/recipe-book-47.svg?component';
	import Baby from '$img/icons/baby.svg?component';


	const menuItems: MenuItem[] = [
		{
			label: 'Home',
			link: '/',
			Icon: Dashboard
		},
		{
			label: 'To Do',
			link: '/tasks',
			auth: true,
			Icon: List
		},
		{
			label: 'Calendar',
			link: '/calendar',
			auth: true,
			Icon: Calendar
		},
		{
			label: 'Recipes',
			link: '/recipes',
			Icon: Recipes
		},
		{
			label: 'Meal Plan',
			link: '/meal-plan',
			auth: true,
			Icon: Plan
		},
		{
			label: 'Shopping List',
			link: '/shopping-list',
			auth: true,
			Icon: Cart
		},
		{
			label: 'Reference',
			link: '/reference',
			auth: true,
			Icon: Archive
		},
		{
			label: 'Small Human',
			link: '/small-human',
			auth: true,
			Icon: Baby
		},
	];

	function handleSignIn() {
		$clerk?.redirectToSignIn();
	}
</script>

<header class="header">
	<a href="/" class="title">🏡</a>
	<MainMenu {menuItems} isAuthenticated={$isAuthenticated}>
		{#if !$isAuthenticated}
			<li>
				<button onclick={handleSignIn}>Sign in</button>
			</li>
		{/if}
	</MainMenu>
</header>

<style>
	@import '@mixins';

	.header {
		@include container_spacing;

		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		font-size: 1.2em;
		font-weight: 700;
		grid-area: header;
	}

	.title {
		display: block;
		font-size: 3em;
		text-decoration: none;
	}
</style>
