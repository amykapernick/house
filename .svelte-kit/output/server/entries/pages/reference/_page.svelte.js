import { i as head, s as unsubscribe_stores } from "../../../chunks/server.js";
import "../../../chunks/auth.js";
import "../../../chunks/fetchClientData.js";
//#region src/routes/reference/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		head("1a9r10a", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Reference | Kapers Crewe Household</title>`);
			});
		});
		$$renderer.push(`<h1>Reference</h1> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>Loading...</p>`);
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
