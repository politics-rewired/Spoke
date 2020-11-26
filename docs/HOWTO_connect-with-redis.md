# Redis Caching

Our fork supports redis caching of common database queries using the [`memoredis`](https://github.com/politics-rewired/memoredis) Redis memoization library.

To enable this, just set the `REDIS_URL` environment variable.

## Differences from MoveOn/main

The MoveOn fork uses a caching approach reliant on the home-rolled RethinkDB movel adapter. We jettisoned this adapter and moved to SQL queries only.
