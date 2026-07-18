// Runs the full stylelint config (no --fix) and reports every finding, same
// scope as `lint:styles:ci`. Most rules here (house/no-repeated-value,
// selector-nested-pattern, ...) are pre-existing debt or judgment calls and
// stay non-blocking. `declaration-no-important` is the one exception - it's a
// hard rule with no legitimate use in this codebase, so any hit here fails
// the build even though the rest of the run doesn't.
import stylelint from 'stylelint';

const BLOCKING_RULES = new Set([`declaration-no-important`]);

const { results, output } = await stylelint.lint({
	files: [`src/**/*.{css,svelte}`],
	configFile: `./config/stylelint.config.cjs`,
	formatter: `string`,
});

console.log(output);

const blockingCount = results.reduce(
	(total, result) => total + result.warnings.filter((warning) => warning.severity === `error` && BLOCKING_RULES.has(warning.rule)).length,
	0
);

if (blockingCount > 0) {
	console.error(`${blockingCount} blocking stylelint error(s) (${[...BLOCKING_RULES].join(`, `)}) - failing build.`);
	process.exit(1);
}
