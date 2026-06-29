import "../../../chunks/index-server.js";
import { i as head, s as unsubscribe_stores } from "../../../chunks/server.js";
import "../../../chunks/auth.js";
import "../../../chunks/fetchClientData.js";
function symbol() {
	return Symbol("ec");
}
//#endregion
//#region node_modules/@event-calendar/core/src/lib/payload.js
var payloadProp = symbol();
function setPayload(obj, payload) {
	obj[payloadProp] = payload;
}
function _createResources(input, level, hidden, flat) {
	let result = [];
	for (let item of input) {
		let resource = createResource(item);
		result.push(resource);
		flat.push(resource);
		let payload = {
			level,
			children: [],
			hidden
		};
		setPayload(resource, payload);
		if (item.children) payload.children = _createResources(item.children, level + 1, hidden || !resource.expanded, flat);
	}
	return result;
}
function createResource(input) {
	return {
		id: String(input.id),
		title: input.title || "",
		eventBackgroundColor: eventBackgroundColor(input),
		eventTextColor: eventTextColor(input),
		expanded: input.expanded ?? true,
		extendedProps: input.extendedProps ?? {}
	};
}
function eventBackgroundColor(resource) {
	return resource?.eventBackgroundColor;
}
function eventTextColor(resource) {
	return resource?.eventTextColor;
}
globalThis.Date;
globalThis.Set;
globalThis.Map;
globalThis.URL;
globalThis.URLSearchParams;
//#endregion
//#region src/routes/calendar/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		head("13luymz", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Calendar | Kapers Crewe Household</title>`);
			});
			$$renderer.push(`<meta name="description" content="View combined calendars and tasks for the family"/>`);
		});
		$$renderer.push(`<h1>Calendar</h1> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>Loading...</p>`);
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
