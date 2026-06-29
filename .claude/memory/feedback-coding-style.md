---
name: feedback-coding-style
description: "User preferences for coding style — custom CSS only, no Tailwind, follow existing project conventions"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2406f905-ea6a-4f31-8fb8-12901deb6175
---

No component libraries, no Tailwind — all styling is custom CSS written by the user.

**Why:** Strong personal preference, the user builds and writes all styling themselves.

**How to apply:** Use scoped `<style>` blocks in Svelte components with the existing PostCSS pipeline (postcss-advanced-variables, postcss-nesting, postcss-mixins). Use CSS variables from the design system (`var(--purple_bright)`, `var(--navy)`, etc.). Reference mixins with `@import '@mixins'` and `@include`.

Follow existing project conventions — don't change import/export styles (the API mixes CJS `require`/`module.exports` with ESM `import`/`export default` and that's intentional until the ESM migration is done). Don't reformat or restructure code to match a different style. Match what's already there.
