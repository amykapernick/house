import "../../chunks/index-server.js";
import { b as attr, i as head, o as store_get, r as ensure_array_like, s as unsubscribe_stores, t as attr_class, x as escape_html } from "../../chunks/server.js";
import { n as isAuthenticated } from "../../chunks/auth.js";
//#region src/lib/components/parts/MainMenu.svelte
function MainMenu($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { menuItems, isAuthenticated, children } = $$props;
		let subMenu = false;
		$$renderer.push(`<nav><ul class="menu svelte-t7c9t7"><!--[-->`);
		const each_array = ensure_array_like(menuItems.filter(({ auth }) => !auth || isAuthenticated));
		for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
			let { label, link, items } = each_array[$$index_1];
			$$renderer.push(`<li class="svelte-t7c9t7">`);
			if (items) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button${attr("aria-pressed", subMenu === label)}${attr("data-active", subMenu === label)} class="menu_section svelte-t7c9t7">${escape_html(label)}</button> <ul class="sub svelte-t7c9t7"${attr("data-open", subMenu === label)}><!--[-->`);
				const each_array_1 = ensure_array_like(items.filter(({ auth }) => !auth || isAuthenticated));
				for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
					let item = each_array_1[$$index];
					$$renderer.push(`<li class="svelte-t7c9t7"><a${attr("href", item.link)} class="svelte-t7c9t7">${escape_html(item.label)}</a></li>`);
				}
				$$renderer.push(`<!--]--></ul>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<a${attr("href", link)} class="svelte-t7c9t7">${escape_html(label)}</a>`);
			}
			$$renderer.push(`<!--]--></li>`);
		}
		$$renderer.push(`<!--]--> `);
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></ul></nav>`);
	});
}
//#endregion
//#region src/lib/components/partials/Header.svelte
function Header($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		const menuItems = [
			{
				label: "Home",
				link: "/"
			},
			{
				label: "To Do",
				link: "/tasks",
				auth: true
			},
			{
				label: "Calendar",
				link: "/calendar",
				auth: true
			},
			{
				label: "Reference",
				link: "/reference",
				auth: true
			}
		];
		$$renderer.push(`<header class="header svelte-hsuz4u"><a href="/" class="title svelte-hsuz4u">🏡</a> `);
		MainMenu($$renderer, {
			menuItems,
			isAuthenticated: store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated),
			children: ($$renderer) => {
				if (!store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated)) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<li><button>Sign in</button></li>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></header>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
	});
}
//#endregion
//#region src/lib/components/partials/Footer.svelte
function Footer($$renderer) {
	$$renderer.push(`<footer></footer>`);
}
//#endregion
//#region src/lib/components/layouts/Default.svelte
function Default($$renderer, $$props) {
	let { children, fullWidth = false } = $$props;
	$$renderer.push(`<div${attr_class("layout svelte-1yxji5h", void 0, { "full": fullWidth })}>`);
	children($$renderer);
	$$renderer.push(`<!----></div>`);
}
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, data } = $$props;
		head("12qhfyh", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Kapers Crewe Household</title>`);
			});
			$$renderer.push(`<meta name="description" content="Meal Planning, Tasks, Reminders, Calendars"/>`);
		});
		Header($$renderer, {});
		$$renderer.push(`<!----> <main>`);
		Default($$renderer, {
			children: ($$renderer) => {
				children($$renderer);
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></main> `);
		Footer($$renderer, {});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
export { _layout as default };
