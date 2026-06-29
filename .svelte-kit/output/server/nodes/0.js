import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.LeyiyK5i.js","_app/immutable/chunks/Bo5XAPB2.js","_app/immutable/chunks/xihTtKlq.js","_app/immutable/chunks/C-BqhzwM.js","_app/immutable/chunks/4_90evLJ.js","_app/immutable/chunks/DYl5dUZ5.js","_app/immutable/chunks/DWWRncFo.js"];
export const stylesheets = ["_app/immutable/assets/0.eRxGHQUD.css"];
export const fonts = [];
