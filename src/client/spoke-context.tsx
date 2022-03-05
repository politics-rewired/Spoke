import {
  OrganizationSettingsInfoFragment,
  useGetOrganizationSettingsQuery
} from "@spoke/spoke-codegen";
import React, { useContext, useMemo, useState } from "react";

export interface InstanceSettings {
  BASE_URL: string;
  AUTH0_DOMAIN?: string;
  AUTH0_CLIENT_ID?: string;
  RENDERED_CLASS_NAMES?: string[];
}

export interface SpokeContextType {
  settings?: InstanceSettings;
  orgSettings?: OrganizationSettingsInfoFragment;
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
    skip: organizationId === undefined,
    errorPolicy: "ignore"
  });

  const value = useMemo(
    () => ({
      orgSettings: data?.organization?.settings,
      setOrganizationId
    }),
    [data?.organization?.settings, setOrganizationId]
  );

  return (
    <SpokeContext.Provider value={value}>
      {props.children}
    </SpokeContext.Provider>
  );
};

export const useSpokeContext = () => useContext(SpokeContext);

export const withSpokeContext = <P,>(
  Component: React.ComponentType<P & SpokeContextType>
) => {
  const ComponentWithSpokeContext: React.FC<P> = (props) => {
    const context = useSpokeContext();
    return <Component {...props} {...context} />;
  };

  return ComponentWithSpokeContext;
};

export default SpokeContext;
