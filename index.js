module.exports = function PgOrderByMultiColumnIndexPlugin(
  builder,
  { orderByNullsLast }
) {
  builder.hook("build", build => {
    const pkg = require("./package.json");

    // Check dependencies
    if (!build.versions) {
      throw new Error(
        `Plugin ${pkg.name}@${pkg.version} requires graphile-build@^4.1.0 in order to check dependencies (current version: ${build.graphileBuildVersion})`
      );
    }
    const depends = (name, range) => {
      if (!build.hasVersion(name, range)) {
        throw new Error(
          `Plugin ${pkg.name}@${pkg.version} requires ${name}@${range} (${
            build.versions[name]
              ? `current version: ${build.versions[name]}`
              : "not found"
          })`
        );
      }
    };
    depends("graphile-build-pg", "^4.1.0");

    // Register this plugin
    build.versions = build.extend(build.versions, { [pkg.name]: pkg.version });

    return build;
  });

  builder.hook("inflection", inflection => {
    return Object.assign(inflection, {
      orderByMultiColumnIndexEnum(specs) {
        const nullOrderingSuffix = (ascending, nullsFirst) => {
          // Only include a null ordering suffix if it differs
          // from the application default (specified using
          // `graphileBuildOptions.orderByNullsLast`).
          if (orderByNullsLast === true) {
            // Defaults are ASC NULLS LAST and DESC NULLS LAST, so
            // ASC NULLS FIRST and DESC NULLS FIRST need a suffix:
            if (ascending === true && nullsFirst === true) {
              return "-nulls-first";
            } else if (ascending === false && nullsFirst === true) {
              return "-nulls-first";
            } else {
              return "";
            }
          } else {
            // Defaults are ASC NULLS LAST and DESC NULLS FIRST, so
            // ASC NULLS FIRST and DESC NULLS LAST need a suffix:
            if (ascending === true && nullsFirst === true) {
              return "-nulls-first";
            } else if (ascending === false && nullsFirst === false) {
              return "-nulls-last";
            } else {
              return "";
            }
          }
        };

        return `${specs
          .map(([attr, ascending, nullsFirst]) =>
            this.constantCase(
              `${this.orderByColumnEnum(attr, ascending)}${nullOrderingSuffix(
                ascending,
                nullsFirst
              )}`
            )
          )
          .join("__")}`;
      },
    });
  });

  builder.hook("GraphQLEnumType:values", (values, build, context) => {
    const {
      extend,
      inflection,
      pgIntrospectionResultsByKind: introspectionResultsByKind,
      describePgEntity,
    } = build;
    const {
      scope: { isPgRowSortEnum, pgIntrospection: table },
    } = context;
    if (!isPgRowSortEnum || !table || table.kind !== "class") {
      return values;
    }

    return extend(
      values,
      introspectionResultsByKind.index
        .filter(index => index.class.id === table.id)
        .reduce((memo, index) => {
          const attributes = index.attributeNums.map(nr =>
            index.class.attributes.find(attr => attr.num === nr)
          );

          if (attributes.length <= 1 || attributes.indexOf(undefined) > -1) {
            // Not a multi-column index
            return memo;
          }

          // Specs for scanning the index forward
          const forwardSpecs = attributes.map((attr, idx) => [
            attr,
            index.attributePropertiesAsc[idx],
            index.attributePropertiesNullsFirst[idx],
          ]);

          // Specs for scanning the index backward (flip asc/desc and nulls first/last)
          const backwardSpecs = attributes.map((attr, idx) => [
            attr,
            !index.attributePropertiesAsc[idx],
            !index.attributePropertiesNullsFirst[idx],
          ]);

          const forwardEnumName = inflection.orderByMultiColumnIndexEnum(
            forwardSpecs
          );
          const backwardEnumName = inflection.orderByMultiColumnIndexEnum(
            backwardSpecs
          );
          memo = extend(
            memo,
            {
              [forwardEnumName]: {
                value: {
                  alias: forwardEnumName.toLowerCase(),
                  specs: forwardSpecs.map(([attr, ascending, nullsFirst]) => [
                    attr.name,
                    ascending,
                    nullsFirst,
                  ]),
                },
              },
            },
            `Adding multi-column index forward orderBy enum value for ${attributes
              .map(attr => describePgEntity(attr))
              .join(", ")}.`
          );
          memo = extend(
            memo,
            {
              [backwardEnumName]: {
                value: {
                  alias: backwardEnumName.toLowerCase(),
                  specs: backwardSpecs.map(([attr, ascending, nullsFirst]) => [
                    attr.name,
                    ascending,
                    nullsFirst,
                  ]),
                },
              },
            },
            `Adding multi-column index backward orderBy enum value for ${attributes
              .map(attr => describePgEntity(attr))
              .join(", ")}.`
          );
          return memo;
        }, {}),
      `Adding multi-column index order values for table '${table.name}'`
    );
  });
};
