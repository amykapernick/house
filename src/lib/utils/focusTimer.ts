import { writable } from 'svelte/store';
import { notify as notifyWithTag } from './notifications';

export { notificationsSupported, notificationPermission, requestNotificationPermission } from './notifications';

export type FocusPhaseType = `work` | `break`;

export type FocusPhase = {
	type: FocusPhaseType;
	label: string;
	seconds: number;
};

export type FocusPresetId = `classic` | `taper` | `flexible`;

export const FOCUS_PRESETS: { id: FocusPresetId; name: string; description: string; needsHours: boolean }[] = [
	{
		id: `classic`,
		name: `20/5 Pomodoro`,
		description: `20 min focus blocks with 5 min breaks, repeating for a set number of hours`,
		needsHours: true,
	},
	{
		id: `taper`,
		name: `Taper (50→10)`,
		description: `50/40/30/20/10 min focus blocks with 10 min breaks between, shrinking as the session goes on`,
		needsHours: false,
	},
	{
		id: `flexible`,
		name: `Flexible`,
		description: `Blocks of 20-30 min focus time with 5 min breaks, adjusting for your desired working time`,
		needsHours: true
	},
];

const MINUTE = 60;

export function buildClassicSequence(hours: number): FocusPhase[] {
	if (!Number.isFinite(hours) || hours <= 0) return [];

	const workMinutes = 20;
	const breakMinutes = 5;
	const cycleMinutes = workMinutes + breakMinutes;
	// Solve for the number of work+break cycles whose total (minus the final,
	// dropped break) lands closest to the requested duration, so the session
	// always ends on a work block rather than trailing off on a break.
	const cycles = Math.max(1, Math.round((hours * 60 + breakMinutes) / cycleMinutes));

	const phases: FocusPhase[] = [];
	for (let i = 0; i < cycles; i++) {
		phases.push({ type: `work`, label: `Focus`, seconds: workMinutes * MINUTE });
		if (i < cycles - 1) phases.push({ type: `break`, label: `Break`, seconds: breakMinutes * MINUTE });
	}
	return phases;
}

export function buildTaperSequence(): FocusPhase[] {
	const workBlockMinutes = [50, 40, 30, 20, 10];
	const breakMinutes = 10;

	const phases: FocusPhase[] = [];
	workBlockMinutes.forEach((minutes, i) => {
		phases.push({ type: `work`, label: `Focus`, seconds: minutes * MINUTE });
		if (i < workBlockMinutes.length - 1) phases.push({ type: `break`, label: `Break`, seconds: breakMinutes * MINUTE });
	});
	return phases;
}

const FLEXIBLE_BLOCK_MINUTES = [20, 25, 30] as const;

export function buildFlexibleSequence(hours: number): FocusPhase[] {
	if (!Number.isFinite(hours) || hours <= 0) return [];

	const breakMinutes = 5;
	const totalMinutes = Math.round(hours * 60);

	if (totalMinutes < FLEXIBLE_BLOCK_MINUTES[0]) return [];

	// For each candidate uniform block length (20/25/30), fit as many blocks of
	// that length as possible, then see if a single smaller allowed length can
	// absorb whatever's left over - so every block stays snapped to 20/25/30
	// min and at most one (the last) differs from the rest. Keep whichever
	// candidate uses the most of the requested time; ties favour fewer, larger
	// blocks over more, smaller ones.
	let best: { blockMinutes: number; count: number; lastBlockMinutes: number | null; totalUsed: number } | null = null;

	for (const blockMinutes of FLEXIBLE_BLOCK_MINUTES) {
		const count = Math.floor((totalMinutes + breakMinutes) / (blockMinutes + breakMinutes));
		if (count < 1) continue;

		const usedTime = count * blockMinutes + (count - 1) * breakMinutes;
		const availableForLastBlock = totalMinutes - usedTime - breakMinutes;
		const lastBlockMinutes = [...FLEXIBLE_BLOCK_MINUTES].reverse().find((minutes) => minutes <= availableForLastBlock) ?? null;
		const totalUsed = usedTime + (lastBlockMinutes ? breakMinutes + lastBlockMinutes : 0);

		if (!best || totalUsed > best.totalUsed || (totalUsed === best.totalUsed && blockMinutes > best.blockMinutes)) {
			best = { blockMinutes, count, lastBlockMinutes, totalUsed };
		}
	}

	if (!best) return [];

	const phases: FocusPhase[] = [];
	for (let i = 0; i < best.count; i++) {
		phases.push({ type: `work`, label: `Focus`, seconds: best.blockMinutes * MINUTE });
		if (i < best.count - 1 || best.lastBlockMinutes) phases.push({ type: `break`, label: `Break`, seconds: breakMinutes * MINUTE });
	}
	if (best.lastBlockMinutes) phases.push({ type: `work`, label: `Focus`, seconds: best.lastBlockMinutes * MINUTE });

	return phases;
}

export function buildSequence(presetId: FocusPresetId, hours: number): FocusPhase[] {
	if (presetId === `classic`) return buildClassicSequence(hours);
	if (presetId === `flexible`) return buildFlexibleSequence(hours);
	return buildTaperSequence();
}

export function formatRemaining(ms: number): string {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, `0`)}`;
}

export type FocusTimerState = {
	presetId: FocusPresetId;
	phases: FocusPhase[];
	phaseIndex: number;
	phaseEndAt: number; // epoch ms; only meaningful while running (not paused)
	paused: boolean;
	pausedRemainingMs: number;
};

const STORAGE_KEY = `focusTimer:state`;

function loadPersisted(): FocusTimerState | null {
	if (typeof localStorage === `undefined`) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	}
	catch {
		return null;
	}
}

function persist(state: FocusTimerState | null) {
	if (typeof localStorage === `undefined`) return;
	if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	else localStorage.removeItem(STORAGE_KEY);
}

export const focusTimerState = writable<FocusTimerState | null>(loadPersisted());
focusTimerState.subscribe(persist);

function notify(title: string, body: string) {
	notifyWithTag(title, body, `focus-timer`);
}

let audioCtx: AudioContext | null = null;

// Creating/resuming the AudioContext must happen from a user gesture (the
// Start button click) - once resumed, later calls from the tick loop can
// still play sound even though they aren't triggered by a gesture themselves.
function unlockAudio() {
	if (typeof window === `undefined` || typeof AudioContext === `undefined`) return;
	if (!audioCtx) audioCtx = new AudioContext();
	if (audioCtx.state === `suspended`) audioCtx.resume();
}

type ChimeKind = `focusEnd` | `breakEnd` | `sessionComplete`;

function playTone(startTime: number, freq: number, duration: number, volume = 0.35) {
	if (!audioCtx) return;
	const oscillator = audioCtx.createOscillator();
	const gain = audioCtx.createGain();
	oscillator.frequency.value = freq;
	gain.gain.setValueAtTime(volume, startTime);
	gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
	oscillator.connect(gain);
	gain.connect(audioCtx.destination);
	oscillator.start(startTime);
	oscillator.stop(startTime + duration);
}

type ChimeNote = { freq: number; offset: number; duration: number };

// Each phase transition gets its own short tone pattern so you can tell what
// happened without looking at the screen: a falling two-note chime into a
// break, a rising two-note chime back into focus, and a three-note fanfare
// when the whole session ends. Each pattern plays three times in a row so
// it's hard to miss even if you're not looking at the screen when it starts.
const CHIME_PATTERNS: Record<ChimeKind, ChimeNote[]> = {
	focusEnd: [
		{ freq: 880, offset: 0, duration: 0.8 },
		{ freq: 659.25, offset: 0.25, duration: 0.9 },
	],
	breakEnd: [
		{ freq: 659.25, offset: 0, duration: 0.7 },
		{ freq: 880, offset: 0.2, duration: 0.9 },
	],
	sessionComplete: [
		{ freq: 523.25, offset: 0, duration: 0.5 },
		{ freq: 659.25, offset: 0.28, duration: 0.5 },
		{ freq: 783.99, offset: 0.56, duration: 1.1 },
	],
};

const CHIME_REPEATS = 3;
const CHIME_REPEAT_GAP = 0.3;

function playChime(kind: ChimeKind) {
	if (!audioCtx) return;
	const now = audioCtx.currentTime;
	const pattern = CHIME_PATTERNS[kind];
	const patternDuration = Math.max(...pattern.map((note) => note.offset + note.duration));
	const repeatPeriod = patternDuration + CHIME_REPEAT_GAP;

	for (let i = 0; i < CHIME_REPEATS; i++) {
		const repeatStart = now + i * repeatPeriod;
		pattern.forEach((note) => playTone(repeatStart + note.offset, note.freq, note.duration));
	}
}

let originalTitle: string | null = null;
let titleFlashInterval: ReturnType<typeof setInterval> | null = null;

function stopTitleFlash() {
	if (titleFlashInterval) clearInterval(titleFlashInterval);
	titleFlashInterval = null;
	if (typeof document !== `undefined` && originalTitle !== null) document.title = originalTitle;
	originalTitle = null;
}

function startTitleFlash(message: string) {
	if (typeof document === `undefined` || !document.hidden) return;
	stopTitleFlash();
	originalTitle = document.title;
	let showMessage = true;
	titleFlashInterval = setInterval(() => {
		document.title = showMessage ? message : (originalTitle ?? document.title);
		showMessage = !showMessage;
	}, 1500);
	document.addEventListener(
		`visibilitychange`,
		function onVisible() {
			if (!document.hidden) {
				stopTitleFlash();
				document.removeEventListener(`visibilitychange`, onVisible);
			}
		}
	);
}

function advancePhase(state: FocusTimerState): FocusTimerState | null {
	const finishedPhase = state.phases[state.phaseIndex];
	const nextIndex = state.phaseIndex + 1;
	const hasNext = nextIndex < state.phases.length;

	notify(
		hasNext ? `${finishedPhase.type === `work` ? `Break` : `Focus`} time` : `Session complete`,
		hasNext
			? `${finishedPhase.label} finished - next up: ${state.phases[nextIndex].label}`
			: `Nice work - you finished your focus session.`
	);
	playChime(!hasNext ? `sessionComplete` : finishedPhase.type === `work` ? `focusEnd` : `breakEnd`);
	startTitleFlash(hasNext ? `⏰ ${state.phases[nextIndex].label} time!` : `⏰ Session complete!`);

	if (!hasNext) return null;

	return {
		...state,
		phaseIndex: nextIndex,
		phaseEndAt: Date.now() + state.phases[nextIndex].seconds * 1000,
	};
}

export function startFocusTimer(presetId: FocusPresetId, hours = 0) {
	const phases = buildSequence(presetId, hours);
	if (!phases.length) return;

	unlockAudio();
	stopTitleFlash();

	focusTimerState.set({
		presetId,
		phases,
		phaseIndex: 0,
		phaseEndAt: Date.now() + phases[0].seconds * 1000,
		paused: false,
		pausedRemainingMs: 0,
	});
}

export function pauseFocusTimer() {
	focusTimerState.update((state) => {
		if (!state || state.paused) return state;
		return { ...state, paused: true, pausedRemainingMs: Math.max(0, state.phaseEndAt - Date.now()) };
	});
}

export function resumeFocusTimer() {
	focusTimerState.update((state) => {
		if (!state || !state.paused) return state;
		return { ...state, paused: false, phaseEndAt: Date.now() + state.pausedRemainingMs };
	});
}

export function stopFocusTimer() {
	stopTitleFlash();
	focusTimerState.set(null);
}

// Runs for the lifetime of the page (registered once at module load, not tied
// to any single component) so the timer keeps advancing - and still notifies
// on schedule - regardless of which route is currently mounted. Uses wall-clock
// timestamps rather than a decrementing counter so a throttled/backgrounded tab
// still ends up in the correct phase whenever this next fires, even if several
// phases elapsed while it was suspended.
if (typeof window !== `undefined`) {
	setInterval(() => {
		focusTimerState.update((state) => {
			if (!state || state.paused) return state;

			let next: FocusTimerState | null = state;
			while (next && Date.now() >= next.phaseEndAt) {
				next = advancePhase(next);
			}
			return next ? { ...next } : null;
		});
	}, 1000);
}
