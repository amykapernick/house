<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { isAuthenticated } from '$lib/auth';
	import { menuItems } from '$lib/navigation';
	import { theme, setTheme } from '$utils/theme';
	import type { TocEntry } from '$utils/markdown';
	import type { Habit } from '$types/habits';
	import type { Chore } from '$types/chores';
	import type { User } from '$types/global';
	import type { MilestoneStatus } from '$types/generated';
	import { getPageTitle } from '$utils/pageTitle';
	import Moon from '$img/icons/moon.svg?component';
	import Sun from '$img/icons/u2600-sunrays.svg?component';

	import Pill from '$parts/Pill.svelte';
	import Tabs from '$parts/Tabs.svelte';
	import Card from '$parts/Card.svelte';
	import Cards from '$parts/Cards.svelte';
	import Switch from '$parts/Switch.svelte';
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';
	import TableOfContents from '$parts/content/TableOfContents.svelte';
	import Autocomplete from '$parts/Autocomplete.svelte';
	import SegmentedToggle from '$parts/SegmentedToggle.svelte';
	import CommandPalette from '$parts/CommandPalette.svelte';
	import ColourSelect from '$parts/ColourSelect.svelte';
	import HabitView from '$parts/habits/HabitView.svelte';
	import ChoreList from '$parts/chores/ChoreList.svelte';
	import IconChip from '$parts/IconChip.svelte';
	import Toast from '$parts/Toast.svelte';
	import EmptyState from '$parts/EmptyState.svelte';
	import DropdownMenu from '$parts/DropdownMenu.svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import Tooltip from '$parts/Tooltip.svelte';
	import DataTable from '$parts/DataTable.svelte';
	import Stepper from '$parts/Stepper.svelte';
	import FamilyFilter from '$parts/FamilyFilter.svelte';
	import PieChart from '$components/parts/graph/PieChart.svelte';
	import BarChart from '$components/parts/graph/BarChart.svelte';
	import ProgressBarChart from '$parts/ProgressBarChart.svelte';
	import LineChart from '$components/parts/graph/LineChart.svelte';
	import Milestone from '$parts/smallHuman/Milestone.svelte';
	import StatusSelect from '$parts/smallHuman/StatusSelect.svelte';

	const themeOptions: ['light', 'dark'] = ['light', 'dark'];
	function handleThemeToggle(index: number) {
		setTheme(themeOptions[index]);
	}

	let activeTab = $state('overview');
	const devTabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'details', label: 'Details' },
		{ id: 'history', label: 'History' },
	];

	let modalOpen = $state(false);
	let confirmOpen = $state(false);
	const confirmActions: ModalAction[] = [
		{ label: `Cancel`, onclick: () => (confirmOpen = false), style: `secondary`, variant: `danger` },
		{ label: `Delete`, onclick: () => (confirmOpen = false), variant: `danger` },
	];

	let showToc = $state(false);
	const devToc: TocEntry[] = [
		{ level: 2, text: 'Section one', anchor: 'dev-toc-one' },
		{ level: 2, text: 'Section two', anchor: 'dev-toc-two' },
		{ level: 3, text: 'Section three', anchor: 'dev-toc-three' },
	];
	const devReadAnchors = new Set(['dev-toc-one']);

	let autocompleteValue = $state('');
	let autocompleteSelected = $state('');
	const devAutocompleteItems = [
		{ id: '1', name: 'Groceries', badge: 'List' },
		{ id: '2', name: 'Garden', badge: 'Task' },
		{ id: '3', name: 'Budget', badge: 'Task' },
		{ id: '4', name: 'Garden shed repair', badge: 'Task' },
	];
	async function searchDevAutocomplete(query: string) {
		const match = query.toLowerCase();
		return devAutocompleteItems.filter((item) => item.name.toLowerCase().includes(match));
	}

	let segmentedValue = $state('day');

	let paletteOpen = $state(false);

	let swatchColour = $state('purple_bright');

	const devUser: User = {
		slug: 'dev-user',
		name: 'Alex',
		profile: '',
		ids: { notion: '', todoist: '', github: '' },
		colour: 'purple_bright',
	};
	const devHabits: Habit[] = [
		{
			id: 'dev-habit-1',
			name: '💧 Drink water',
			recurrenceInterval: { count: 1, unit: 'day' },
			streak: 5,
			link: '',
			assigned: [devUser],
			completions: [new Date().toISOString()],
		},
		{
			id: 'dev-habit-2',
			name: 'Stretch',
			recurrenceInterval: { count: 1, unit: 'day' },
			streak: 0,
			link: '',
			assigned: [devUser],
			completions: [],
		},
	];

	const devChores: Chore[] = [
		{ id: 'dev-chore-1a', name: 'Do dishes', labels: ['kitchen'] },
		{ id: 'dev-chore-1b', name: 'Clear bench', labels: ['kitchen'] },
		{ id: 'dev-chore-1c', name: 'Wipe stove', labels: ['kitchen'] },
		{ id: 'dev-chore-2', name: 'Take out bins', labels: [] },
	];

	const devMilestoneStatuses: Record<MilestoneStatus, string> = {
		done: 'Done',
		in_progress: 'In Progress',
		watch: 'Watch',
		upcoming: 'Upcoming',
	};
	let devStatus = $state<MilestoneStatus>('upcoming');
	function handleStatusChange(_id: string, status: MilestoneStatus) {
		devStatus = status;
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Components`)}</title>
</svelte:head>

{#if !import.meta.env.DEV}
	<p>The component reference is only available when running the app locally.</p>
{:else}
	<h1>Components</h1>
	<p>One section per component backlog item. New components get their content filled in here as they're built.</p>

	<section>
		<h2>Status pill</h2>
		<ul class="example">
			<li><Pill status="success">Active</Pill></li>
			<li><Pill status="error">Inactive</Pill></li>
			<li><Pill status="warning">Pending</Pill></li>
			<li><Pill status="info">Info</Pill></li>
			<li><Pill>Default</Pill></li>
		</ul>
	</section>

	<section>
		<h2>Tag/chip</h2>
		<ul class="example">
			<li><Pill outline>Groceries</Pill></li>
			<li><Pill outline>Urgent</Pill></li>
		</ul>
	</section>

	<section>
		<h2>Tabs</h2>
		<Tabs
			tabs={devTabs}
			active={activeTab}
			onSelect={(id) => (activeTab = id)}
		/>
		<div
			role="tabpanel"
			id="panel-{activeTab}"
			aria-labelledby="tab-{activeTab}"
		>
			{#if activeTab === 'overview'}Overview panel content.{/if}
			{#if activeTab === 'details'}Details panel content.{/if}
			{#if activeTab === 'history'}History panel content.{/if}
		</div>
	</section>

	<section>
		<h2>Card</h2>
		<Cards>
			<Card theme="light">
				<h3>Light Card</h3>
				<p>Card content.</p>
			</Card>
			<Card theme="dark">
				<h3>Dark Card</h3>
				<p>Card content.</p>
			</Card>
		</Cards>
	</section>

	<section>
		<h2>Switch</h2>
		<Switch
			class="theme"
			name="Colour Mode"
			value={themeOptions.indexOf($theme)}
			toggleFunction={handleThemeToggle}
			options={[
				{ label: 'Light Mode', Icon: Sun },
				{ label: 'Dark Mode', Icon: Moon },
			]}
		/>
	</section>

	<section>
		<h2>Modal/dialog</h2>
		<button
			type="button"
			onclick={() => (modalOpen = true)}>Open modal</button
		>
		<Modal
			bind:open={modalOpen}
			title="Modal title"
		>
			<p>Modal body content.</p>
		</Modal>
	</section>

	<section>
		<h2>Sticky drawer/TOC</h2>
		<TableOfContents
			toc={devToc}
			readAnchors={devReadAnchors}
			bind:showToc
		/>
	</section>

	<section>
		<h2>Autocomplete/search input</h2>
		<Autocomplete
			id="dev-autocomplete"
			label="Autocomplete/search input"
			bind:value={autocompleteValue}
			placeholder="Search..."
			onSearch={searchDevAutocomplete}
			onSelect={(item) => (autocompleteSelected = item.name)}
			getKey={(item) => item.id}
			getLabel={(item) => item.name}
			getBadge={(item) => item.badge}
		/>
	</section>

	<section>
		<h2>Segmented toggle</h2>
		<SegmentedToggle
			legend="View"
			name="dev-segmented"
			bind:value={segmentedValue}
			options={[
				{ value: 'day', label: 'Day' },
				{ value: 'week', label: 'Week' },
				{ value: 'month', label: 'Month' },
			]}
		/>
	</section>

	<section>
		<h2>Command palette</h2>
		<button
			type="button"
			onclick={() => (paletteOpen = true)}>Open command palette</button
		>
		<CommandPalette
			bind:open={paletteOpen}
			{menuItems}
			isAuthenticated={$isAuthenticated}
		/>
	</section>

	<section>
		<h2>Colour swatch select</h2>
		<ColourSelect
			id="dev-colour"
			bind:value={swatchColour}
			colours={['purple_bright', 'blue', 'green']}
		/>
	</section>

	<section>
		<h2>Habit streak</h2>
		<HabitView habits={devHabits} />
	</section>

	<section>
		<h2>Chore checklist</h2>
		<ChoreList chores={devChores} />
	</section>

	<section>
		<h2>Icon chip/tag</h2>
		<IconChip
			icon="calendar"
			label="Urgent"
			colour="red"
		/>
	</section>

	<section>
		<h2>Toast notification</h2>
		<Toast
			message="Saved successfully."
			variant="success"
		/>
	</section>

	<section>
		<h2>Empty state</h2>
		<EmptyState
			title="No tasks yet"
			message="Add your first task to get started."
		>
			<button type="button">Add a task</button>
		</EmptyState>
	</section>

	<section>
		<h2>Confirmation dialog</h2>
		<button
			type="button"
			onclick={() => (confirmOpen = true)}>Delete item</button
		>
		<Modal
			bind:open={confirmOpen}
			title="Delete this item?"
			actions={confirmActions}
		>
			<p>This can't be undone.</p>
		</Modal>
	</section>

	<section>
		<h2>Dropdown menu</h2>
		<DropdownMenu
			label="Options"
			items={[
				{ label: 'Edit', onClick: () => {} },
				{ label: 'Duplicate', onClick: () => {} },
				{ label: 'Delete', onClick: () => {} },
			]}
		/>
	</section>

	<section>
		<h2>Loading skeleton</h2>
		<Skeleton rows={3} />
	</section>

	<section>
		<h2>Tooltip</h2>
		<Tooltip label="This is a tooltip">
			<button type="button">Info</button>
		</Tooltip>
	</section>

	<section>
		<h2>Data table</h2>
		<DataTable
			id="dev-table-filter"
			columns={[
				{ key: 'name', label: 'Name' },
				{ key: 'status', label: 'Status' },
			]}
			rows={[
				{ name: 'Row one', status: 'Active' },
				{ name: 'Row two', status: 'Inactive' },
			]}
		/>
	</section>

	<section>
		<h2>Progress/stepper</h2>
		<Stepper
			steps={['Details', 'Payment', 'Confirmation']}
			currentIndex={1}
		/>
	</section>

	<section>
		<h2>Family Filter</h2>
		<FamilyFilter pageKey="dev-components" />
	</section>

	<section>
		<h2>Pie chart</h2>
		<PieChart
			slices={[
				{ label: 'Groceries', value: 120, colour: 'green' },
				{ label: 'Utilities', value: 80, colour: 'blue' },
				{ label: 'Entertainment', value: 40, colour: 'orange' },
			]}
			formatValue={(v) => `$${v}`}
			centerValue="$240"
			centerLabel="Total"
		/>
	</section>

	<section>
		<h2>Vertical Bar Chart</h2>
		<BarChart
			groups={[
				{ label: 'Week 1', bars: [{ name: 'Spent', colour: 'purple_bright', value: 120 }] },
				{ label: 'Week 2', bars: [{ name: 'Spent', colour: 'purple_bright', value: 90 }] },
			]}
			unit="$"
		/>
	</section>

	<section>
		<h2>Progress bar chart</h2>
		<ProgressBarChart
			id="dev-progress-bar"
			items={[
				{ label: 'Task one', value: 70 },
				{ label: 'Task two', value: 30 },
			]}
		/>
	</section>

	<section>
		<h2>Line chart</h2>
		<LineChart
			lines={[
				{
					data: [
						{ x: new Date('2026-07-10'), y: 10 },
						{ x: new Date('2026-07-12'), y: 14 },
						{ x: new Date('2026-07-14'), y: 9 },
					],
					style: { colour: 'green' },
					unit: 'kg',
				},
			]}
			formatX={(x) => format(x, DATE_FORMATS.short)}
			leftLabel="Weight"
		/>
	</section>

	<section>
		<h2>Horizontal Bar chart</h2>
		<BarChart
			groups={[
				{ label: 'Groceries', bars: [{ name: 'Spent', colour: 'green', value: 120 }] },
				{ label: 'Utilities', bars: [{ name: 'Spent', colour: 'blue', value: 80 }] },
			]}
			unit="$"
			orientation="horizontal"
		/>
	</section>

	<section>
		<h2>Milestone card</h2>
		<Milestone
			id="dev-milestone"
			title="First steps"
			status="done"
			type="movement"
			detail="Took first independent steps."
			expected_months={[9, 12]}
		/>
	</section>

	<section>
		<h2>Status select</h2>
		<StatusSelect
			id="dev-status-select"
			status={devStatus}
			labels={devMilestoneStatuses}
			onChange={handleStatusChange}
		/>
	</section>
{/if}

<style>
	.example {
		list-style: none;

		& li {
			margin-bottom: 20px;
		}
	}

</style>
