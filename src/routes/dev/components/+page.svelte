<script lang="ts">
	import { getPageTitle } from '$utils/pageTitle';
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
		<span class="pill">Active</span>
		<span class="pill">Inactive</span>
		<span class="pill">Pending</span>
	</section>

	<section>
		<h2>Tag/chip</h2>
		<span class="tag">Groceries</span>
		<span class="tag">Urgent</span>
	</section>

	<section>
		<h2>Tabs</h2>
		<div role="tablist" aria-label="Dev tabs example">
			<button type="button" role="tab" aria-selected="true" id="dev-tab-1" aria-controls="dev-tabpanel-1">Overview</button>
			<button type="button" role="tab" aria-selected="false" id="dev-tab-2" aria-controls="dev-tabpanel-2">Details</button>
			<button type="button" role="tab" aria-selected="false" id="dev-tab-3" aria-controls="dev-tabpanel-3">History</button>
		</div>
		<div role="tabpanel" id="dev-tabpanel-1" aria-labelledby="dev-tab-1">Overview panel content.</div>

	</section>

	<section>
		<h2>Card (light and dark variant)</h2>
		<article class="card card-light">
			<h3>Card title</h3>
			<p>Light variant card content.</p>
		</article>
		<article class="card card-dark">
			<h3>Card title</h3>
			<p>Dark variant card content.</p>
		</article>
	</section>

	<section>
		<h2>Switch</h2>
		<button type="button" role="switch" aria-checked="false">Notifications</button>
	</section>

	<section>
		<h2>Modal/dialog</h2>
		<dialog open aria-labelledby="dev-modal-title">
			<h3 id="dev-modal-title">Modal title</h3>
			<p>Modal body content.</p>
			<button type="button">Close</button>
		</dialog>
	</section>

	<section>
		<h2>Sticky drawer/TOC</h2>
		<nav aria-label="Table of contents">
			<ul>
				<li><a href="#dev-toc-one">Section one</a></li>
				<li><a href="#dev-toc-two">Section two</a></li>
				<li><a href="#dev-toc-three">Section three</a></li>
			</ul>
		</nav>
	</section>

	<section>
		<h2>Autocomplete/search input</h2>
		<label for="dev-autocomplete">Autocomplete/search input</label>
		<input id="dev-autocomplete" type="search" list="dev-autocomplete-options" placeholder="Search..." />
		<datalist id="dev-autocomplete-options">
			<option value="Groceries"></option>
			<option value="Garden"></option>
			<option value="Budget"></option>
		</datalist>
	</section>

	<section>
		<h2>Segmented toggle</h2>
		<fieldset>
			<legend>View</legend>
			<label><input type="radio" name="dev-segmented" value="day" checked /> Day</label>
			<label><input type="radio" name="dev-segmented" value="week" /> Week</label>
			<label><input type="radio" name="dev-segmented" value="month" /> Month</label>
		</fieldset>
	</section>

	<section>
		<h2>Command palette</h2>
		<label for="dev-command">Command palette</label>
		<input id="dev-command" type="text" placeholder="Type a command..." />
		<ul>
			<li>Go to Tasks</li>
			<li>Go to Calendar</li>
			<li>Add a task</li>
		</ul>
	</section>

	<section>
		<h2>Colour swatch select</h2>
		<fieldset>
			<legend>Colour</legend>
			<label><input type="radio" name="dev-colour" value="purple" checked /> Purple</label>
			<label><input type="radio" name="dev-colour" value="navy" /> Navy</label>
			<label><input type="radio" name="dev-colour" value="green" /> Green</label>
		</fieldset>
	</section>

	<section>
		<h2>Habit streak</h2>
		<ol>
			<li>Mon - done</li>
			<li>Tue - done</li>
			<li>Wed - missed</li>
			<li>Thu - done</li>
			<li>Fri - done</li>
			<li>Sat - missed</li>
			<li>Sun - done</li>
		</ol>
	</section>

	<section>
		<h2>Icon chip/tag</h2>
		<span class="icon-chip"><span aria-hidden="true">[icon]</span> Urgent</span>
	</section>

	<section>
		<h2>Toast notification</h2>
		<div role="status" aria-live="polite">Saved successfully.</div>
	</section>

	<section>
		<h2>Empty state</h2>
		<h3>No tasks yet</h3>
		<p>Add your first task to get started.</p>
		<button type="button">Add a task</button>
	</section>

	<section>
		<h2>Confirmation dialog</h2>
		<dialog open aria-labelledby="dev-confirm-title">
			<h3 id="dev-confirm-title">Delete this item?</h3>
			<p>This can't be undone.</p>
			<button type="button">Cancel</button>
			<button type="button">Delete</button>
		</dialog>
	</section>

	<section>
		<h2>Dropdown menu</h2>
		<details>
			<summary>Options</summary>
			<ul>
				<li><button type="button">Edit</button></li>
				<li><button type="button">Duplicate</button></li>
				<li><button type="button">Delete</button></li>
			</ul>
		</details>
	</section>

	<section>
		<h2>Loading skeleton</h2>
		<div aria-hidden="true">
			<div class="skeleton-line"></div>
			<div class="skeleton-line"></div>
			<div class="skeleton-line"></div>
		</div>
	</section>

	<section>
		<h2>Tooltip</h2>
		<button type="button" aria-describedby="dev-tooltip">Info</button>
		<span role="tooltip" id="dev-tooltip">This is a tooltip</span>
	</section>

	<section>
		<h2>Data table</h2>
		<label for="dev-table-filter">Filter rows</label>
		<input id="dev-table-filter" type="search" placeholder="Filter rows..." />
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Row one</td>
					<td>Active</td>
				</tr>
				<tr>
					<td>Row two</td>
					<td>Inactive</td>
				</tr>
			</tbody>
		</table>
		<nav aria-label="Table pagination">
			<button type="button">Previous</button>
			<button type="button">Next</button>
		</nav>
	</section>

	<section>
		<h2>Progress/stepper</h2>
		<progress value="50" max="100">50%</progress>
		<ol>
			<li>Details</li>
			<li aria-current="step">Payment</li>
			<li>Confirmation</li>
		</ol>
	</section>

	<section>
		<h2>Online status</h2>
		<span>Online</span>
	</section>

	<section>
		<h2>Offline status</h2>
		<span>Offline</span>
	</section>

	<section>
		<h2>Family Filter</h2>
		<fieldset>
			<legend>Family</legend>
			<label><input type="checkbox" checked /> Family member one</label>
			<label><input type="checkbox" checked /> Family member two</label>
			<label><input type="checkbox" /> Family member three</label>
		</fieldset>
	</section>

	<section>
		<h2>Pie chart</h2>
		<figure>
			<figcaption>Pie chart</figcaption>
			<div>Chart placeholder</div>
		</figure>
	</section>

	<section>
		<h2>Vertical Bar Chart</h2>
		<figure>
			<figcaption>Vertical bar chart</figcaption>
			<div>Chart placeholder</div>
		</figure>
	</section>

	<section>
		<h2>Progress bar chart</h2>
		<label for="dev-progress-bar-1">Task one</label>
		<progress id="dev-progress-bar-1" value="70" max="100">70%</progress>
		<label for="dev-progress-bar-2">Task two</label>
		<progress id="dev-progress-bar-2" value="30" max="100">30%</progress>
	</section>

	<section>
		<h2>Line chart</h2>
		<figure>
			<figcaption>Line chart</figcaption>
			<div>Chart placeholder</div>
		</figure>
	</section>

	<section>
		<h2>Horizontal Bar chart</h2>
		<figure>
			<figcaption>Horizontal bar chart</figcaption>
			<div>Chart placeholder</div>
		</figure>
	</section>

	<section>
		<h2>Milestone card</h2>
		<article class="card">
			<h3>First steps</h3>
			<time datetime="2026-07-16">16 July 2026</time>
			<p>Milestone description.</p>
		</article>
	</section>

	<section>
		<h2>Status select</h2>
		<label for="dev-status-select">Status select</label>
		<select id="dev-status-select">
			<option>To do</option>
			<option>In progress</option>
			<option>Done</option>
		</select>
	</section>
{/if}
