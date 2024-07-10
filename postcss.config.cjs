const path = require("path");

const colours = require("./src/styles/config/colours.cjs");
const variables = require("./src/styles/config/variables.cjs");

const aliases = {
  "@styles": (filename) => path.resolve(__dirname, "./src/styles", filename),
  "@mixins": (filename) => {
    if (!filename)
      return path.resolve(__dirname, "./src/styles/mixins/index.css");

    path.resolve(__dirname, "./src/styles/mixins", filename);
  },
  "@img": (filename) => path.resolve(__dirname, "../src/img", filename),
};

module.exports = {
  plugins: [
    [
      "postcss-import",
      {
        root: path.resolve(__dirname, "./src/styles"),
        skipDuplicates: true,
        resolve: (id, basedir, importOptions) => {
          const [aliasName, filename] = id.split("/");
          if (aliasName[0] !== "@") return id;
          return aliases[aliasName](filename);
        },
      },
    ],
    [
      "postcss-advanced-variables",
      {
        disable: "@import",
        variables: {
          ...colours,
          ...variables,
        },
      },
    ],
    "postcss-hexrgba",
    [
      "postcss-nesting",
      {
        noIsPseudoSelector: true,
      },
    ],
    [
      "stylelint",
      {
        configFile: `./config/stylelint.config.cjs`,
        fix: true,
      },
    ],
  ],
};
