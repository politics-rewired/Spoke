import { messageSender789 } from './job-processes'
import { log } from '../lib/log'

messageSender789().catch((err) => { log.error(err) })
