<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import TaskCard from '../Task/index.svelte';
	import PillCheckbox from '$parts/PillCheckbox/index.svelte';
	import { completeTask as completeTaskRequest } from '$utils/completeTask';
	import { updateTaskStatus } from '$utils/updateTaskStatus';
	import { getHiddenColumns, saveHiddenColumns } from '$utils/kanbanColumnPreference';
	import type { Task, TaskStatus } from '$types/tasks';
	import styles from './index.module.css';

	let {
		tasks = [],
		onUpdate,
		class: className = '',
	}: { tasks: Task[]; onUpdate?: (id: string, status: TaskStatus) => void; class?: string } = $props();

	const STATUS_ORDER: TaskStatus[] = ['Not Started', 'In Progress', 'Ongoing', 'Paused', 'Done'];
	const STATUS_LABELS: Record<TaskStatus, string> = {
		'Not Started': 'To Do',
		'In Progress': 'In Progress',
		'Ongoing': 'Ongoing',
		'Paused': 'Paused',
		'Done': 'Done',
	};

	// Keys the [data-status] colour selectors in this component's own CSS.
	function statusKey(status: TaskStatus): string {
		return status.replaceAll(' ', '-').toLowerCase();
	}

	let hiddenStatuses = new SvelteSet<string>(getHiddenColumns());
	let visibleOrder = $derived(STATUS_ORDER.filter((status) => !hiddenStatuses.has(status)));

	let grouped = $derived.by(() => {
		const groups: Record<string, Task[]> = {};
		STATUS_ORDER.forEach((status) => { groups[status] = []; });
		tasks.forEach((task) => { groups[task.status]?.push(task); });
		return groups;
	});

	// Where a task is allowed to move, given its platform's real capabilities:
	// Todoist and GitHub only ever move Not Started -> Done (completeTask covers
	// both - there's no "reopen"/reverse mutation for either), Notion can go anywhere.
	function movableTargets(task: Task): TaskStatus[] {
		if (task.platform === 'todoist' || task.platform === 'github') {
			return task.status === 'Done' ? [] : ['Done'];
		}
		return STATUS_ORDER.filter((status) => status !== task.status);
	}

	function allowedVisibleTargets(task: Task): TaskStatus[] {
		const targets = new Set(movableTargets(task));
		return visibleOrder.filter((status) => targets.has(status));
	}

	// Drag-and-drop is the only Kanban-specific way to move a card - beyond that,
	// a card moves column by changing status via its own checkbox/select (Task
	// component), which already updates `tasks` and lets this board re-group.
	let cardState = $state<Record<string, { saving: boolean; error: string }>>({});

	async function moveTask(task: Task, targetStatus: TaskStatus) {
		cardState[task.id] = { saving: true, error: '' };

		const useComplete = targetStatus === 'Done' && (task.platform === 'todoist' || task.platform === 'github');
		const result = useComplete
			? await completeTaskRequest(task.id, task.platform)
			: await updateTaskStatus(task.id, targetStatus);

		if ('queued' in result && result.queued) {
			cardState[task.id] = { saving: false, error: '' };
			return;
		}

		if (!result.success) {
			cardState[task.id] = { saving: false, error: "Couldn't move this task. Try again." };
			return;
		}

		cardState[task.id] = { saving: false, error: '' };
		onUpdate?.(task.id, targetStatus);
	}

	function toggleColumn(status: TaskStatus) {
		if (hiddenStatuses.has(status)) hiddenStatuses.delete(status);
		else hiddenStatuses.add(status);
		saveHiddenColumns([...hiddenStatuses]);
	}

	let draggedTaskId = $state<string | null>(null);

	function handleDragStart(event: DragEvent, task: Task) {
		draggedTaskId = task.id;
		event.dataTransfer?.setData('text/plain', task.id);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	function handleDragEnd() {
		draggedTaskId = null;
	}

	function draggedTask(): Task | undefined {
		return tasks.find((task) => task.id === draggedTaskId);
	}

	function handleDragOver(event: DragEvent, status: TaskStatus) {
		const task = draggedTask();
		if (!task || !allowedVisibleTargets(task).includes(status)) return;

		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(event: DragEvent, status: TaskStatus) {
		event.preventDefault();
		const task = draggedTask();
		draggedTaskId = null;
		if (!task || !allowedVisibleTargets(task).includes(status)) return;

		moveTask(task, status);
	}
</script>

<div class={styles.columnToggles}>
	{#each STATUS_ORDER as status (status)}
		<span class={styles.toggle} data-status={statusKey(status)}>
			<PillCheckbox
				id="kanban-column-{statusKey(status)}"
				label={STATUS_LABELS[status]}
				count={grouped[status].length}
				checked={!hiddenStatuses.has(status)}
				onchange={() => toggleColumn(status)}
			/>
		</span>
	{/each}
</div>

<div class="{styles.board} {className}" style="

--columns: {visibleOrder.length}">
	{#each visibleOrder as status (status)}
		<div
			class={styles.column}
			data-status={statusKey(status)}
			role="group"
			aria-label={STATUS_LABELS[status]}
			ondragover={(event) => handleDragOver(event, status)}
			ondrop={(event) => handleDrop(event, status)}
		>
			<h2>{STATUS_LABELS[status]} <span class={styles.count}>{grouped[status].length}</span></h2>
			<ul class={styles.list}>
				{#each grouped[status] as task (task.id)}
					{@const state = cardState[task.id]}
					<li
						class={styles.item}
						draggable={allowedVisibleTargets(task).length > 0}
						ondragstart={(event) => handleDragStart(event, task)}
						ondragend={handleDragEnd}
					>
						<TaskCard {...task} {onUpdate} />
						{#if state?.error}<p class={styles.error}>{state.error}</p>{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
