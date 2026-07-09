// Run by .github/workflows/auslan-signs-updated.yml in response to a repository_dispatch from
// household_api, fired after every scheduled small-human tracker update. Takes the current
// Auslan sign videos as a JSON payload (no PocketBase access from this repo) and generates a
// gif for any sign that doesn't already have one in static/signs/ - already-converted signs are
// skipped, so this is safe to run on every dispatch even when nothing actually changed.
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, `../static/signs`);

const convertToGif = async (videoUrl, outPath) => {
	const res = await fetch(videoUrl);
	if (!res.ok) throw new Error(`Failed to download video (${res.status})`);

	const tmpVideo = path.join(os.tmpdir(), `sign-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);
	await fs.writeFile(tmpVideo, Buffer.from(await res.arrayBuffer()));

	try {
		await execFileAsync(`ffmpeg`, [
			`-y`,
			`-i`, tmpVideo,
			`-vf`, `fps=12,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
			outPath,
		]);
	}
	finally {
		await fs.rm(tmpVideo, { force: true });
	}
};

const run = async () => {
	const signs = JSON.parse(process.env.AUSLAN_SIGNS_PAYLOAD ?? `[]`);
	await fs.mkdir(OUTPUT_DIR, { recursive: true });

	let generated = 0;
	let skipped = 0;
	let failed = 0;

	for (const sign of signs) {
		if (!sign.video) continue;

		const outPath = path.join(OUTPUT_DIR, `${sign.id}.gif`);
		if (existsSync(outPath)) {
			skipped += 1;
			continue;
		}

		try {
			console.log(`Generating gif for ${sign.id}...`);
			await convertToGif(sign.video, outPath);
			generated += 1;
		}
		catch (err) {
			failed += 1;
			console.error(`  Failed: ${err.message}`);
		}
	}

	console.log(`\nDone. ${generated} generated, ${skipped} already existed, ${failed} failed.`);

	if (process.env.GITHUB_OUTPUT) {
		await fs.appendFile(process.env.GITHUB_OUTPUT, `generated=${generated}\n`);
	}
};

run().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
