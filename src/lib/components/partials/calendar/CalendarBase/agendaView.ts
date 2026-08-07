import { ViewModel, registerCalendarView, type Section } from '@svar-ui/calendar-store';

// A month-long, grouped-by-day list of events - @svar-ui/svelte-calendar's
// free tier has no built-in Agenda view (that's PRO-only), but the mode:"list"
// section renderer ships in the free bundle and is driven entirely through
// this documented ViewModel/registerCalendarView extension mechanism, so no
// PRO license or undocumented internals are needed.
//
// mode:"list" falls through ViewModel's generic processSection into
// layoutBoxes rather than a dedicated list layout, but ListSection.svelte
// (the actual renderer) only reads primitive.event/.id, not position/lane -
// so the wasted box-layout math is harmless.
//
// The yScale below is a single dummy "all" bucket (accessor never matches a
// real event field) - identical to the idiom @svar-ui/calendar-store's own
// WeekViewModel uses for its multiday bars row. ViewModel.findUnitIndex
// special-cases a 1-unit scale to always resolve to unit 0 without even
// calling the accessor, so every event lands in the single list rather than
// being dropped for "not matching" a resource/group it was never meant to.
class AgendaViewModel extends ViewModel {
	getSections(): Section[] {
		return [
			{
				name: `agenda`,
				mode: `list`,
				xScale: { type: `date`, length: this.daysInMonth(), visible: false },
				yScale: { type: `unit`, items: [{ id: `all`, label: `` }], accessor: `_`, visible: false },
				size: `content`,
			},
		];
	}

	getRangeLabel(): string {
		return this.fmt(`titleMonthFormat`)(this.startDate);
	}

	rangeStart(date: Date): Date {
		const first = new Date(date);
		first.setDate(1);
		first.setHours(0, 0, 0, 0);
		return first;
	}

	addRange(date: Date, n: number): Date {
		const d = new Date(date);
		d.setDate(1);
		d.setMonth(d.getMonth() + n);
		return d;
	}

	private daysInMonth(): number {
		const monthStart = this.startDate ?? new Date();
		const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
		return Math.round((nextMonth.getTime() - monthStart.getTime()) / 86_400_000);
	}
}

registerCalendarView(`agenda`, AgendaViewModel);
