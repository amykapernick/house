<script lang="ts">
	import Select from '$components/parts/Select.svelte';
	import Slider from '$components/parts/Slider.svelte';
	import { getPageTitle } from '$utils/pageTitle';

	let sliderValue = $state(50);
</script>

<svelte:head>
	<title>{getPageTitle(`Typography`)}</title>
</svelte:head>

{#if !import.meta.env.DEV}
	<p>The typography reference is only available when running the app locally.</p>
{:else}
	<h1>Typography</h1>

	<section>
		<h2>Headings</h2>
			<h1>Heading one</h1>
			<h2>Heading two</h2>
			<h3>Heading three</h3>
			<h4>Heading four</h4>
			<h5>Heading five</h5>
	</section>

	<section>
		<h2>Buttons</h2>
		<ul class="example">
			<li><button type="button">Primary</button></li>
			<li><button type="button" class="secondary">Secondary</button></li>
			<li><button type="button" class="text">Text</button></li>
		</ul>
	</section>

	<section>
		<h2>Main text</h2>
		<p>Regular paragraph text. It wraps a <a href="#dev-typography">link</a> to show the default link colour, and some <strong>bold</strong> and <em>italic</em> inline styling. Inline <code>code</code> uses the monospace font.</p>
		<ul>
			<li>List Item 1</li>
			<li>List Item 2</li>
			<li>More List Items</li>
		</ul>
		<ol>
			<li>Important list item</li>
			<li>In order</li>
			<li>More List Items</li>
		</ol>
	</section>

	<section>
		<h2>Form Inputs</h2>
		<label for="dev-text">Text input</label>
		<input id="dev-text" type="text" placeholder="Placeholder text" />

		<label for="dev-select">Select field</label>
		<!-- TODO: Add id passthrough ability -->
		<Select
			id="dev-select"
			options={[
				{label: 'Option One', value: '1'},
				{label: 'Option Two', value: '3'}
			]}
		/>

		<fieldset>
			<div>
				<legend>Radio button</legend>
				<input type="radio" name="dev-radio" value="one" checked />
				<label> Option one</label>
				<input type="radio" name="dev-radio" value="two" />
				<label> Option two</label>
			
			</div>
		</fieldset>

		<input type="checkbox" checked />
		<label> Checked</label>
		<input type="checkbox" />
		<label> Unchecked</label>
		

		<Slider id="dev-slider" label="Slider input" bind:value={sliderValue} unit="%" />

		<label for="dev-date">Date picker</label>
		<input id="dev-date" type="date" />
	</section>
{/if}


<style>
	@import '@mixins';

	button {
		&.secondary {
			@include button_secondary;
		}

		&.text {
			@include button_text;
		}
	}

	.example {
		list-style: none;

		& li {
			margin-bottom: 20px;
		}
	}
</style>