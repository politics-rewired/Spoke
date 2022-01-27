import React from "react";

import { OrganizationSettings } from "../api/organization-settings";
import { CustomTheme } from "../styles/types";

export interface InstanceSettings {
  BASE_URL: string;
  AUTH0_DOMAIN?: string;
  AUTH0_CLIENT_ID?: string;
  RENDERED_CLASS_NAMES?: string[];
}

export interface SpokeContextType {
  settings?: InstanceSettings;
  orgSettings?: OrganizationSettings;
  setOrgSettings?: (settings?: OrganizationSettings) => void;
  theme?: CustomTheme;
}

export const SpokeContext = React.createContext<SpokeContextType>({});

export function withSpokeContext<P>(Component: React.Component<P>) {
  return function SpokeContextComponent(props: P) {
    return (
      <SpokeContext.Consumer>
        {(contexts) => <Component {...props} {...contexts} />}
      </SpokeContext.Consumer>
    );
  };
}

export default SpokeContext;
