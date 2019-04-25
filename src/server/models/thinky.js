import dumbThinky from 'rethink-knex-adapter'
import redis from 'redis'
import bluebird from 'bluebird'
import config from '../knex.js'

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

// Instantiate the rethink-knex-adapter using the config defined in
// /src/server/knex.js.
const thinkyConn = dumbThinky(config)

thinkyConn.r.getCount = async (query) => {
  // helper method to get a count result
  // with fewer bugs.  Using knex's .count()
  // results in a 'count' key on postgres, but a 'count(*)' key
  // on sqlite -- ridiculous.  This smooths that out
  if (Array.isArray(query)) {
    return query.length
  }
  return Number((await query.count('* as count').first()).count)
}

/**
 * Helper method to parse the result of a knex `count` query (see above).
 */
thinkyConn.r.parseCount = async (query) => {
  if (Array.isArray(query)) {
    return query.length
  }

  const result = (await query)[0]
  const keys = Object.keys(result)
  if (keys.length === 1) {
    const countKey = keys[0]
    return result[countKey]
  }

  throw new Error('Multiple columns returned by the query!')
}

if (process.env.REDIS_URL) {
  thinkyConn.r.redis = redis.createClient({ url: process.env.REDIS_URL })
} else if (process.env.REDIS_FAKE) {
  const fakeredis = require('fakeredis')
  bluebird.promisifyAll(fakeredis.RedisClient.prototype)
  bluebird.promisifyAll(fakeredis.Multi.prototype)

  thinkyConn.r.redis = fakeredis.createClient()
}

export default thinkyConn
