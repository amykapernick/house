import { ViewModel, registerCalendarView, isMultiDay, type Section } from '@svar-ui/calendar-store';

// One column per family member, time running vertically - same axis as the
// built-in Day view, just with the day's single implicit column split into
// one per resource. Built the same way as agendaView.ts: a documented
// ViewModel/registerCalendarView extension, not a PRO feature.
//
// The resource column list itself is injected per-render via the `views`
// prop's ViewConfig.sections deep-merge (see CalendarBase), not stored on
// this class - keeps the ViewModel itself stateless/reusable and lets it
// react to family members loading in after the calendar first mounts. The
// single-item fallback here only covers the brief window before that first
// injection lands.
//
// DiscreteScale.accessor resolves one id per event (event.resourceId), so an
// event assigned to multiple family members (event.resourceIds.length > 1)
// only appears in its first assignee's column - see toResourceEvents in
// CalendarBase, which is what actually populates resourceId from
// resourceIds[0]. Showing it in every assigned column would need exploding
// the event into per-resource copies, which would then also leak into
// month/week/day/agenda since all views share one underlying event store.
export class ResourcesViewModel extends ViewModel {
	getSections(): Section[] {
		return [
			// Mirrors WeekViewModel/DayViewModel's own multiday+timeGrid split
			// (see @svar-ui/calendar-store) - all-day events get their own bar
			// row above the hourly grid instead of being squeezed into a sliver
			// of an hour, still organised into the same per-resource columns
			// (xScale.items, injected the same way as the timeGrid section
			// below - see CalendarBase's svarViews).
			{
				name: `multiday`,
				mode: `bars`,
				xScale: {
					type: `unit`,
					items: [{ id: `_none`, label: `` }],
					accessor: `resourceId`,
				},
				yScale: {
					type: `unit`,
					items: [{ id: `all`, label: `` }],
					accessor: `_`,
					visible: false,
				},
				filter: (event) => isMultiDay(event),
				size: `content-optional`,
			},
			{
				name: `resources`,
				mode: `boxes`,
				xScale: {
					type: `unit`,
					items: [{ id: `_none`, label: `` }],
					accessor: `resourceId`,
				},
				yScale: {
					type: `time`,
					startHour: 0,
					endHour: 24,
					step: 30,
					snapStep: 15,
					format: `timeScaleFormat`,
				},
				filter: (event) => !isMultiDay(event),
				size: 1,
			},
		];
	}

	getRangeLabel(): string {
		return this.fmt(`titleDayFormat`)(this.startDate);
	}

	rangeStart(date: Date): Date {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		return d;
	}

	addRange(date: Date, n: number): Date {
		const d = new Date(date);
		d.setDate(d.getDate() + n);
		return d;
	}
}

registerCalendarView(`resources`, ResourcesViewModel);
