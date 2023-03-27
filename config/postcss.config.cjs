module.exports = {
	plugins: [
		//   require('autoprefixer'),
		//   require('cssnano'),
		require('postcss-nesting'),
		require('stylelint')({
			configFile: './config/.stylelint.config.cjs'
		})
	],
};


// const atImport = require('postcss-import')
// const stylelint = require('stylelint')
// const nesting = require('postcss-nesting')
// const mixins = require('postcss-mixins')

// module.exports = {
//   plugins: [
//     atImport,
//     mixins({
//       mixinsFiles: './styles/mixins/*.css'
//     }),
//     nesting,
//     stylelint
//   ],
// };