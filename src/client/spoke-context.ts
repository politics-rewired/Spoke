import React from "react";

import { CustomTheme } from "../styles/types";

export interface InstanceSettings {
  BASE_URL: string;
  AUTH0_DOMAIN?: string;
  AUTH0_CLIENT_ID?: string;
  RENDERED_CLASS_NAMES?: string[];
}

export interface SpokeContextType {
  settings?: InstanceSettings;
  theme?: CustomTheme;
}

export const SpokeContext = React.createContext<SpokeContextType>({});

export default SpokeContext;
