import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

async function importFresh() {
	vi.resetModules();
	return import(`./focusTimer`);
}

describe(`buildClassicSequence`, () => {
	it(`returns an empty sequence for zero or negative hours`, async () => {
		const { buildClassicSequence } = await importFresh();
		expect(buildClassicSequence(0)).toEqual([]);
		expect(buildClassicSequence(-1)).toEqual([]);
	});

	it(`alternates 20 min work / 5 min break blocks and ends on work`, async () => {
		const { buildClassicSequence } = await importFresh();
		const phases = buildClassicSequence(2);

		expect(phases.length).toBeGreaterThan(0);
		expect(phases[phases.length - 1].type).toBe(`work`);
		phases.forEach((phase, i) => {
			expect(phase.type).toBe(i % 2 === 0 ? `work` : `break`);
			expect(phase.seconds).toBe(phase.type === `work` ? 20 * 60 : 5 * 60);
		});
	});

	it(`produces more cycles for a longer requested duration`, async () => {
		const { buildClassicSequence } = await importFresh();
		const short = buildClassicSequence(1);
		const long = buildClassicSequence(4);
		expect(long.length).toBeGreaterThan(short.length);
	});
});

describe(`buildFlexibleSequence`, () => {
	it(`returns an empty sequence for zero, negative, or too-short durations`, async () => {
		const { buildFlexibleSequence } = await importFresh();
		expect(buildFlexibleSequence(0)).toEqual([]);
		expect(buildFlexibleSequence(-1)).toEqual([]);
		expect(buildFlexibleSequence(10 / 60)).toEqual([]); // 10 minutes, below the 20 min minimum block
	});

	it(`only ever uses 20, 25 or 30 min work blocks and 5 min breaks, ending on work`, async () => {
		const { buildFlexibleSequence } = await importFresh();

		for (const hours of [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]) {
			const phases = buildFlexibleSequence(hours);
			expect(phases.length).toBeGreaterThan(0);
			expect(phases[phases.length - 1].type).toBe(`work`);
			phases.forEach((phase, i) => {
				expect(phase.type).toBe(i % 2 === 0 ? `work` : `break`);
				if (phase.type === `work`) expect([20, 25, 30]).toContain(phase.seconds / 60);
				else expect(phase.seconds).toBe(5 * 60);
			});
		}
	});

	it(`makes work blocks the same length except for a smaller uneven block at the end`, async () => {
		const { buildFlexibleSequence } = await importFresh();
		const phases = buildFlexibleSequence(1.5); // 90 minutes -> 30, 30, 20

		const workBlocks = phases.filter((p) => p.type === `work`).map((p) => p.seconds / 60);
		expect(workBlocks.slice(0, -1).every((minutes) => minutes === workBlocks[0])).toBe(true);
		expect(workBlocks[workBlocks.length - 1]).toBeLessThanOrEqual(workBlocks[0]);
	});

	it(`fits entirely within the requested duration`, async () => {
		const { buildFlexibleSequence } = await importFresh();
		const hours = 2;
		const phases = buildFlexibleSequence(hours);
		const totalMinutes = phases.reduce((sum, p) => sum + p.seconds / 60, 0);
		expect(totalMinutes).toBeLessThanOrEqual(hours * 60);
	});
});

describe(`buildTaperSequence`, () => {
	it(`builds the fixed 50/40/30/20/10 work blocks with 10 min breaks and no trailing break`, async () => {
		const { buildTaperSequence } = await importFresh();
		const phases = buildTaperSequence();

		expect(phases.map((p) => p.type)).toEqual([
			`work`, `break`, `work`, `break`, `work`, `break`, `work`, `break`, `work`,
		]);
		expect(phases.filter((p) => p.type === `work`).map((p) => p.seconds / 60)).toEqual([50, 40, 30, 20, 10]);
		expect(phases.filter((p) => p.type === `break`).every((p) => p.seconds === 10 * 60)).toBe(true);
	});
});

describe(`formatRemaining`, () => {
	it(`formats milliseconds as m:ss`, async () => {
		const { formatRemaining } = await importFresh();
		expect(formatRemaining(0)).toBe(`0:00`);
		expect(formatRemaining(5000)).toBe(`0:05`);
		expect(formatRemaining(65000)).toBe(`1:05`);
	});

	it(`never returns a negative time`, async () => {
		const { formatRemaining } = await importFresh();
		expect(formatRemaining(-5000)).toBe(`0:00`);
	});
});

describe(`focus timer engine`, () => {
	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
		localStorage.clear();
	});

	it(`starts a timer with the first phase of the chosen preset`, async () => {
		const { startFocusTimer, focusTimerState } = await importFresh();

		startFocusTimer(`taper`);
		const state = get(focusTimerState);

		expect(state?.presetId).toBe(`taper`);
		expect(state?.phaseIndex).toBe(0);
		expect(state?.paused).toBe(false);
		expect(state?.phases[0].seconds).toBe(50 * 60);
	});

	it(`advances to the next phase once its time elapses`, async () => {
		const { startFocusTimer, focusTimerState } = await importFresh();

		startFocusTimer(`taper`);
		vi.advanceTimersByTime(50 * 60 * 1000 + 1000);

		const state = get(focusTimerState);
		expect(state?.phaseIndex).toBe(1);
		expect(state?.phases[state.phaseIndex].type).toBe(`break`);
	});

	it(`skips through multiple elapsed phases at once (simulating a backgrounded tab)`, async () => {
		const { startFocusTimer, focusTimerState } = await importFresh();

		startFocusTimer(`taper`);
		// 50 work + 10 break + 40 work + 10 break = 110 minutes; jump past it all in one go.
		vi.advanceTimersByTime(110 * 60 * 1000 + 1000);

		const state = get(focusTimerState);
		expect(state?.phaseIndex).toBe(4);
		expect(state?.phases[state.phaseIndex].type).toBe(`work`);
	});

	it(`clears the timer once the final phase elapses`, async () => {
		const { startFocusTimer, focusTimerState, buildTaperSequence } = await importFresh();

		startFocusTimer(`taper`);
		const totalMs = buildTaperSequence().reduce((sum: number, p: { seconds: number }) => sum + p.seconds * 1000, 0);
		vi.advanceTimersByTime(totalMs + 1000);

		expect(get(focusTimerState)).toBeNull();
	});

	it(`pause freezes the remaining time and resume picks back up from there`, async () => {
		const { startFocusTimer, pauseFocusTimer, resumeFocusTimer, focusTimerState } = await importFresh();

		startFocusTimer(`taper`);
		vi.advanceTimersByTime(10 * 60 * 1000);
		pauseFocusTimer();

		const pausedState = get(focusTimerState);
		expect(pausedState?.paused).toBe(true);
		expect(pausedState?.pausedRemainingMs).toBe(40 * 60 * 1000);

		// Time passing while paused must not advance the phase.
		vi.advanceTimersByTime(5 * 60 * 1000);
		expect(get(focusTimerState)?.phaseIndex).toBe(0);

		resumeFocusTimer();
		expect(get(focusTimerState)?.paused).toBe(false);

		vi.advanceTimersByTime(40 * 60 * 1000 + 1000);
		expect(get(focusTimerState)?.phaseIndex).toBe(1);
	});

	it(`stop clears the state`, async () => {
		const { startFocusTimer, stopFocusTimer, focusTimerState } = await importFresh();

		startFocusTimer(`classic`, 1);
		stopFocusTimer();

		expect(get(focusTimerState)).toBeNull();
	});
});
