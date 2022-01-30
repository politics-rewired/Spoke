import React, { useContext, useState } from "react";

import {
  TexterOrganizationSettingsFragmentFragment,
  useGetOrganizationSettingsQuery
} from "../../libs/spoke-codegen/src";

export interface InstanceSettings {
  BASE_URL: string;
  AUTH0_DOMAIN?: string;
  AUTH0_CLIENT_ID?: string;
  RENDERED_CLASS_NAMES?: string[];
}

export interface SpokeContextType {
  settings?: InstanceSettings;
  orgSettings?: TexterOrganizationSettingsFragmentFragment;
  setOrganizationId: (organizationId?: string) => void;
}

export const SpokeContext = React.createContext<SpokeContextType>({
  setOrganizationId: () => {}
});

export const SpokeContextProvider: React.FC = (props) => {
  const [organizationId, setOrganizationId] = useState<string | undefined>(
    undefined
  );

  const { data } = useGetOrganizationSettingsQuery({
    variables: { organizationId: organizationId! },
    skip: organizationId === undefined
  });

  const value = {
    orgSettings: data?.organization?.settings,
    setOrganizationId
  };

  return (
    <SpokeContext.Provider value={value}>
      {props.children}
    </SpokeContext.Provider>
  );
};

export const useSpokeContext = () => useContext(SpokeContext);

export const withSpokeContext = <P extends unknown>(
  Component: React.ComponentType<P & SpokeContextType>
) => {
  const ComponentWithSpokeContext: React.FC<P> = (props) => {
    const context = useSpokeContext();
    return <Component {...props} {...context} />;
  };

  return ComponentWithSpokeContext;
};

export default SpokeContext;
