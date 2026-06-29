import { i as head } from "../../chunks/server.js";
//#region src/routes/+page.svelte
function _page($$renderer) {
	head("1uha8ag", $$renderer, ($$renderer) => {
		$$renderer.title(($$renderer) => {
			$$renderer.push(`<title>Dashboard | Kapers Crewe Household</title>`);
		});
	});
	$$renderer.push(`<h1>Dashboard</h1>`);
}
//#endregion
export { _page as default };
