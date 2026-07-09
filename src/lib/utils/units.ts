import type { RecipeIngredientUnit } from '$lib/types/generated';

// Mealie's `standardUnit` is a free-text label (eg. "gram", "milliliter", "cup"), not a
// foreign key, and isn't guaranteed to match another unit's `name` exactly - British/American
// spellings are the main case seen in practice (litre/liter, millilitre/milliliter).
const BASE_ALIASES: Record<string, string> = {
	litre: `liter`,
	millilitre: `milliliter`,
	metre: `meter`,
};

function normalise(label: string): string {
	const key = label.trim().toLowerCase();
	return BASE_ALIASES[key] ?? key;
}

function byNormalisedName(units: RecipeIngredientUnit[]): Map<string, RecipeIngredientUnit> {
	const map = new Map<string, RecipeIngredientUnit>();
	for (const unit of units) {
		if (unit.name) map.set(normalise(unit.name), unit);
	}
	return map;
}

// Resolves a unit's conversion ratio down to a shared root label by following the
// standardUnit chain (eg. quart -> cup -> liter), since Mealie's ratios aren't always
// expressed against one single base unit.
function resolveRoot(
	unit: RecipeIngredientUnit,
	unitsByName: Map<string, RecipeIngredientUnit>,
	depth = 0
): { root: string; factor: number } | null {
	if (unit.standardQuantity == null || !unit.standardUnit) {
		return unit.name ? { root: normalise(unit.name), factor: 1 } : null;
	}
	if (depth > 5) return null;

	const baseLabel = normalise(unit.standardUnit);
	if (unit.name && normalise(unit.name) === baseLabel) {
		return { root: baseLabel, factor: unit.standardQuantity };
	}

	const baseUnit = unitsByName.get(baseLabel);
	if (!baseUnit) return { root: baseLabel, factor: unit.standardQuantity };

	const parent = resolveRoot(baseUnit, unitsByName, depth + 1);
	if (!parent) return null;
	return { root: parent.root, factor: unit.standardQuantity * parent.factor };
}

/** Other configured units that this one can be converted to/from (excludes itself). */
export function compatibleUnits(
	unit: RecipeIngredientUnit,
	allUnits: RecipeIngredientUnit[]
): RecipeIngredientUnit[] {
	if (unit.standardQuantity == null || !unit.standardUnit) return [];

	const unitsByName = byNormalisedName(allUnits);
	const root = resolveRoot(unit, unitsByName);
	if (!root) return [];

	return allUnits.filter((candidate) => {
		if (candidate.id === unit.id) return false;
		const candidateRoot = resolveRoot(candidate, unitsByName);
		return candidateRoot?.root === root.root;
	});
}

/** The shared root label used to group interconvertible units (eg. "gram", "liter"), or null if this unit has no configured conversion. */
export function unitRoot(unit: RecipeIngredientUnit, allUnits: RecipeIngredientUnit[]): string | null {
	if (unit.standardQuantity == null || !unit.standardUnit) return null;
	return resolveRoot(unit, byNormalisedName(allUnits))?.root ?? null;
}

/** All configured units (including this one) that share the given root. */
export function unitsInFamily(root: string, allUnits: RecipeIngredientUnit[]): RecipeIngredientUnit[] {
	const unitsByName = byNormalisedName(allUnits);
	return allUnits.filter((u) => resolveRoot(u, unitsByName)?.root === root);
}

/** Human-friendly label for a root (eg. "gram" -> "Gram"), based on whichever unit is actually named that. */
export function unitFamilyLabel(root: string, allUnits: RecipeIngredientUnit[]): string {
	const rootUnit = allUnits.find((u) => u.name && normalise(u.name) === root);
	const label = rootUnit?.name ?? root;
	return label.charAt(0).toUpperCase() + label.slice(1);
}

export function convertQuantity(
	quantity: number,
	from: RecipeIngredientUnit,
	to: RecipeIngredientUnit,
	allUnits: RecipeIngredientUnit[]
): number | null {
	if (from.id === to.id) return quantity;

	const unitsByName = byNormalisedName(allUnits);
	const fromRoot = resolveRoot(from, unitsByName);
	const toRoot = resolveRoot(to, unitsByName);
	if (!fromRoot || !toRoot || fromRoot.root !== toRoot.root) return null;

	return (quantity * fromRoot.factor) / toRoot.factor;
}

/** Display label for a unit at a given quantity, preferring abbreviation/plural per its own settings. */
export function unitLabel(unit: RecipeIngredientUnit, quantity: number): string {
	const plural = Math.abs(quantity - 1) > 0.001;
	if (unit.useAbbreviation && unit.abbreviation) {
		return plural && unit.pluralAbbreviation ? unit.pluralAbbreviation : unit.abbreviation;
	}
	if (plural && unit.pluralName) return unit.pluralName;
	return unit.name ?? ``;
}

/** Label for a unit-picker option - not quantity-dependent, so always shown in full. */
export function unitOptionLabel(unit: RecipeIngredientUnit): string {
	return unit.abbreviation ? `${unit.name} (${unit.abbreviation})` : (unit.name ?? ``);
}
