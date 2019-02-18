import { messageSender56 } from './job-processes'
import { log } from '../lib/log'

messageSender56().catch((err) => { log.error(err) })
