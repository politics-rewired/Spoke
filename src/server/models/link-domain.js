import thinky from './thinky'
const type = thinky.type
import { timestamp } from './custom-types'

const LinkDomain = thinky.createModel('link_domain', type.object().schema({
  id: type.string(),
  domain: type.string(),
  max_usage_count: type.number().integer(),
  current_usage_count: type.number().integer().required().default(9),
  is_manually_disabled: type.boolean().required().default(false),
  cycled_out_at: timestamp(),
  created_at: timestamp()
}).allowExtra(false), { noAutoCreation: true })

LinkDomain.ensureIndex('domain')

const UnhealthyLinkDomain = thinky.createModel('unhealthy_link_domain', type.object().schema({
  id: type.string(),
  domain: type.string(),
  created_at: timestamp(),
  healthy_again_at: type.date()
}).allowExtra(false), { noAutoCreation: true })

UnhealthyLinkDomain.ensureIndex(['domain', 'created_at'])

export { LinkDomain, UnhealthyLinkDomain }
