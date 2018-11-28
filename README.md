# @graphile-contrib/pg-order-by-multi-column-index

This Graphile Engine plugin adds enum values to the `orderBy` argument on connections, allowing you to order by multi-column indexes.

> NOTE: If you're not using `ignoreIndexes: false`, then you probably don't need this plugin.

PostGraphile's `ignoreIndexes: false` option only exposes the first column of each multi-column index on `orderBy`. This prevents clients from sending queries with an array of column names/directions that can't make use of the multi-column index. This plugin adds enum values to `orderBy` that match forward and backward scans of the index.

Example:

```sql
create index on p.person (last_name ASC, first_name ASC);
```

```graphql
{
  allPeople(orderBy: LAST_NAME_ASC__FIRST_NAME_ASC) {
    nodes {
      id
      firstName
      lastName
    }
  }
}
```

## Installation

```
yarn add @graphile-contrib/pg-order-by-multi-column-index
```

Requires `postgraphile@^4.1.0-rc.2` or `graphile-build-pg@^4.1.0-rc.2`

## Usage

Append this plugin and the additional `orderBy` enum values will be added to your schema.

### Usage - CLI

```
postgraphile --append-plugins @graphile-contrib/pg-order-by-multi-column-index -c postgres:///my_db
```

### Usage - Library

```js
const express = require("express");
const { postgraphile } = require("postgraphile");
const PgOrderByMultiColumnIndex = require("@graphile-contrib/pg-order-by-multi-column-index");

const app = express();

app.use(
  postgraphile(process.env.DATABASE_URL, "app_public", {
    appendPlugins: [PgOrderByMultiColumnIndex]
  })
);

app.listen(process.env.PORT || 3000);
```