# Redis keys carry the worktree prefix

Git worktrees share one development Redis and tell their keys apart by
`Rails.configuration.x.redis_key_prefix` (from `REDIS_KEY_PREFIX`, which `bin/worktree setup`
sets to `wt_<id>:`; empty in the main checkout, CI and production). It is applied in three places:

- the Rails cache namespace (`config/environments/redis_cache_store.rb`),
- the development Action Cable `channel_prefix` (`config/cable.yml`), which also covers Turbo
  Streams and Y.js sync,
- `OnlineUsersTracker.redis_key`, whose raw `SADD`/`SMEMBERS` calls bypass the cache namespace.

Anything new that talks to Redis directly (`Rails.cache.redis`, `Redis.new`, a new cable
adapter) must start its keys with the prefix too. Otherwise two worktrees read each other's data,
and `bin/worktree gc`, which deletes keys by prefix, leaves them behind.
