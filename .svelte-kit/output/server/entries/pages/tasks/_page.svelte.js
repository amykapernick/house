import { i as head, s as unsubscribe_stores } from "../../../chunks/server.js";
import "../../../chunks/auth.js";
import "../../../chunks/fetchClientData.js";
//#region src/routes/tasks/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		head("1pluywh", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Tasks | Kapers Crewe Household</title>`);
			});
			$$renderer.push(`<meta name="description" content="View all upcoming and overdue tasks in various views"/>`);
		});
		$$renderer.push(`<h1>Tasks</h1> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>Loading...</p>`);
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
