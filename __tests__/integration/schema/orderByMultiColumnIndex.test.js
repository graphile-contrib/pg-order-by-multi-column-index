const core = require("./core");

test(
  "prints a schema with the order-by-multi-column-index plugin",
  core.test(["p"], {
    appendPlugins: [require("../../../index.js")],
    disableDefaultMutations: true,
    legacyRelations: "omit",
    ignoreIndexes: false,
  })
);
