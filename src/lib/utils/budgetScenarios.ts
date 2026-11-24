// Per-device "what if" budget scenarios for the budget page's Scratch Pad tab -
// each one a full copy of the budget items/buckets that can be edited freely
// without touching the real budget. Deliberately localStorage only, no API/data
// store: they're throwaway workings, not household data worth round-tripping.
import type { BudgetItem } from '$types/budget';
import type { BudgetBucket } from '$types/budgetBucket';

const STORAGE_KEY = `budget-scenarios`;

export interface BudgetScenario {
	id: string
	name: string
	budget: BudgetItem[]
	buckets: BudgetBucket[]
	updatedAt: number
}

export function cloneBudget(items: BudgetItem[]): BudgetItem[] {
	return items.map((item) => ({ ...item, bucket: item.bucket ? { ...item.bucket } : undefined }));
}

export function cloneBuckets(items: BudgetBucket[]): BudgetBucket[] {
	return items.map((bucket) => ({ ...bucket }));
}

export function getScenarios(): BudgetScenario[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	}
	catch {
		return [];
	}
}

export function saveScenarios(scenarios: BudgetScenario[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
	}
	catch {}
}

export function createScenario(name: string, budget: BudgetItem[], buckets: BudgetBucket[]): BudgetScenario {
	return {
		id: crypto.randomUUID(),
		name,
		budget: cloneBudget(budget),
		buckets: cloneBuckets(buckets),
		updatedAt: Date.now(),
	};
}

// First "Scenario N" not already taken, so adding/deleting doesn't produce duplicates.
export function nextScenarioName(scenarios: BudgetScenario[]): string {
	const names = new Set(scenarios.map((s) => s.name));
	let n = scenarios.length + 1;
	while (names.has(`Scenario ${n}`)) n++;
	return `Scenario ${n}`;
}
