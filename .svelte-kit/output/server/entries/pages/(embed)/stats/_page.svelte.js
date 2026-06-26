import { i as head, n as derived, s as unsubscribe_stores } from "../../../../chunks/server.js";
import "../../../../chunks/auth.js";
import "../../../../chunks/fetchClientData.js";
//#region src/routes/(embed)/stats/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let guests = [];
		derived(() => {
			const counts = {
				children: 0,
				teens: 0,
				adults: 0,
				vendors: 0,
				dietaries: 0
			};
			guests.forEach((guest) => {
				if (guest.child) {
					if (guest.meal === "Adult") counts.teens++;
					else if (guest.meal === "Kids") counts.children++;
				} else if (guest.meal === "Vendor") counts.vendors++;
				else {
					if (guest.meal === "Dietary") counts.dietaries++;
					counts.adults++;
				}
			});
			return counts;
		});
		derived(() => {
			const counts = {};
			guests.forEach((guest) => {
				if (guest?.dietaries && guest?.dietaries !== "") {
					if (!counts[guest.dietaries]) counts[guest.dietaries] = 0;
					counts[guest.dietaries]++;
				}
			});
			return counts;
		});
		head("5vjhif", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Stats | Kapers Crewe Household</title>`);
			});
		});
		$$renderer.push(`<h1 class="svelte-5vjhif">Stats</h1> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p class="svelte-5vjhif">Loading...</p>`);
		$$renderer.push(`<!--]-->`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
export { _page as default };
