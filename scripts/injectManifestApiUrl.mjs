// Substitutes the `__API_URL__` placeholder in the built manifest.json's Windows
// Widgets Board `data` URL with the real household_api base URL. Runs automatically
// after `vite build` (npm's postbuild lifecycle hook) since this repo deploys via
// adapter-static with no server runtime to template this at request time, and
// Azure/static-web-apps-deploy@v1 runs `npm run build` internally as one atomic
// step - there's no separate workflow step to insert between build and deploy.
// API_URL isn't secret (it's already exposed client-side via VITE_API_URL) but
// Amy didn't want it hardcoded in the committed static/manifest.json, since a
// widget/API endpoint's base URL shouldn't need a source change to move.
import { readFile, writeFile } from 'node:fs/promises';

const MANIFEST_PATH = `build/manifest.json`;
const PLACEHOLDER = `__API_URL__`;

const apiUrl = process.env.API_URL;

if (!apiUrl) {
	console.warn(`[injectManifestApiUrl] API_URL is not set - leaving ${PLACEHOLDER} in ${MANIFEST_PATH} as-is.`);
	process.exit(0);
}

const manifest = await readFile(MANIFEST_PATH, `utf-8`);
await writeFile(MANIFEST_PATH, manifest.replaceAll(PLACEHOLDER, apiUrl));

console.log(`[injectManifestApiUrl] Replaced ${PLACEHOLDER} in ${MANIFEST_PATH}.`);
