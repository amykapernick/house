import { describe, it, expect, beforeEach } from 'vitest';
import { getScenarios, saveScenarios, createScenario, nextScenarioName } from './budgetScenarios';
import type { BudgetItem } from '$types/budget';
import type { BudgetBucket } from '$types/budgetBucket';

const buckets: BudgetBucket[] = [{ id: `b1`, name: `Bills`, percentage: 50 }];
const budget: BudgetItem[] = [{ id: `i1`, description: `Rent`, amount: 2000, period: `Month`, monthlyAmount: 2000, bucket: buckets[0] }];

describe(`budgetScenarios`, () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it(`returns an empty array when nothing has been saved`, () => {
		expect(getScenarios()).toEqual([]);
	});

	it(`round-trips scenarios through localStorage`, () => {
		const scenario = createScenario(`Scenario 1`, budget, buckets);
		saveScenarios([scenario]);

		expect(getScenarios()).toEqual([scenario]);
	});

	it(`returns an empty array for corrupt stored data`, () => {
		localStorage.setItem(`budget-scenarios`, `not json`);

		expect(getScenarios()).toEqual([]);
	});

	it(`copies the budget so editing a scenario doesn't mutate the source`, () => {
		const scenario = createScenario(`Scenario 1`, budget, buckets);
		scenario.budget[0].amount = 1;
		scenario.budget[0].bucket!.name = `Changed`;
		scenario.buckets[0].percentage = 10;

		expect(budget[0].amount).toBe(2000);
		expect(budget[0].bucket!.name).toBe(`Bills`);
		expect(buckets[0].percentage).toBe(50);
	});

	it(`picks the first unused default name`, () => {
		expect(nextScenarioName([])).toBe(`Scenario 1`);

		const one = createScenario(`Scenario 1`, [], []);
		const two = createScenario(`Scenario 2`, [], []);
		expect(nextScenarioName([one, two])).toBe(`Scenario 3`);
		expect(nextScenarioName([createScenario(`Scenario 2`, [], [])])).toBe(`Scenario 3`);
	});
});
