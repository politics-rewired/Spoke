import { messageSender01 } from './job-processes'
import { log } from '../lib/log'

messageSender01().catch((err) => { log.error(err) })
