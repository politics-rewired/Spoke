/* eslint-disable import/prefer-default-export */
import { WebClient } from "@slack/web-api";

import { config } from "../../config";

export const botClient = new WebClient(config.SLACK_TOKEN);
