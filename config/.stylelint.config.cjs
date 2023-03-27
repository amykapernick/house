module.exports = {
	plugins: [
		'stylelint-order',
		'stylelint-use-nesting'
	],
	extends: [
		'stylelint-config-property-sort-order-smacss',
		'stylelint-config-standard',
		'stylelint-config-astro'
	],
	rules: {
		'at-rule-empty-line-before': 'always',
		'block-no-empty': true,
		'color-hex-length': 'long',
		'color-named': 'never',
		'color-no-invalid-hex': true,
		'comment-empty-line-before': 'always',
		'comment-no-empty': true,
		'custom-property-pattern': null,
		"csstools/use-nesting": "always",
		'declaration-block-no-duplicate-properties': [
			true,
			{
				ignore: ["consecutive-duplicates"]
			}
		],
		'declaration-block-no-shorthand-property-overrides': true,
		'declaration-no-important': true,
		'function-calc-no-unspaced-operator': true,
		'function-url-no-scheme-relative': true,
		'import-notation': null,
		'length-zero-no-unit': true,
		'no-descending-specificity': null,
		'no-duplicate-at-import-rules': true,
		'no-duplicate-selectors': true,
		'no-invalid-double-slash-comments': true,
		'no-invalid-position-at-import-rule': null,
		'number-max-precision': 3,
		'order/order': ['custom-properties', 'declarations'],
		'property-no-unknown': [
			true,
			{
				ignoreProperties: ['composes', 'font-named-instance']
			}
		],
		'rule-empty-line-before': ['always', {
			except: ['after-single-line-comment', 'first-nested'],
		}],
		"selector-class-pattern": null,
		'selector-max-attribute': 3,
		"selector-nested-pattern": "^&",
		'selector-pseudo-class-no-unknown': [
			true,
			{
				ignorePseudoClasses: ['global']
			}
		],
		'selector-pseudo-element-colon-notation': 'double',
		'selector-pseudo-element-no-unknown': true,
		'selector-type-no-unknown': true,
		'shorthand-property-no-redundant-values': true,
		'string-no-newline': true,
		'unit-no-unknown': true
	}
}