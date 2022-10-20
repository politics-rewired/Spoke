import Button from "@material-ui/core/Button";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Typography from "@material-ui/core/Typography";
import StarIcon from "@material-ui/icons/Star";
import type { ActiveMessagingServiceFragment } from "@spoke/spoke-codegen";
import {
  useEditCampaignMessagingServiceMutation,
  useGetCampaignMessagingServiceDataQuery,
  useGetOrganizationMessagingServicesQuery
} from "@spoke/spoke-codegen";
import sortBy from "lodash/sortBy";
import React, { useEffect, useState } from "react";
import { compose } from "recompose";

import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import type { FullComponentProps } from "../components/SectionWrapper";
import { asSection } from "../components/SectionWrapper";

const CampaignMessagingServiceForm = (props: FullComponentProps) => {
  const [messagingServiceSid, setMessagingServiceSid] = useState<string>("");

  const {
    data: messagingServicesData,
    loading: messagingServicesLoading
  } = useGetOrganizationMessagingServicesQuery({
    variables: {
      organizationId: props.organizationId
    }
  });

  const {
    data: campaignData,
    loading: campaignLoading
  } = useGetCampaignMessagingServiceDataQuery({
    variables: {
      campaignId: props.campaignId
    }
  });

  const [
    setMessagingServiceSidMutation
  ] = useEditCampaignMessagingServiceMutation();

  useEffect(() => {
    // We wait for campaign data and messaging services to load so that the
    // select doesn't error out because it can't find a child to select
    // with the correct value.
    if (
      !campaignLoading &&
      !messagingServicesLoading &&
      campaignData?.campaign?.messagingServiceSid !== null
    ) {
      setMessagingServiceSid(campaignData?.campaign?.messagingServiceSid ?? "");
    }
  }, [campaignLoading, messagingServicesLoading, campaignData]);

  const messagingServicesUnsorted: ActiveMessagingServiceFragment[] =
    messagingServicesData?.organization?.messagingServices?.edges.map(
      ({ node }) => node
    ) ?? [];
  const messagingServices = sortBy(messagingServicesUnsorted, [
    ({ isDefault }) => (isDefault ? 0 : 1)
  ]);

  const messagingServiceChanged = (
    event: React.ChangeEvent<{ value: any; name?: string }>
  ) => {
    setMessagingServiceSid(event.target.value);
  };

  const handleSubmit = () => {
    const campaign = {
      messagingServiceSid
    };

    setMessagingServiceSidMutation({
      variables: {
        campaignId: props.campaignId,
        payload: campaign
      }
    });
  };

  return (
    <div>
      <CampaignFormSectionHeading
        title="Messaging Service Selection"
        subtitle="Select the messaging service you want to use for this campaign"
      />
      <Select
        id="campaign-messaging-service"
        name="messagingServiceSid"
        value={messagingServiceSid}
        onChange={messagingServiceChanged}
        fullWidth
      >
        {messagingServices.map((service) => {
          const serviceName =
            service.name || `${service.serviceType}: ${service.id}`;
          const suffix = service.isDefault ? " (Default)" : "";
          const label = `${serviceName}${suffix}`;
          return (
            <MenuItem key={service.id} value={service.id}>
              <ListItemIcon>
                {service.isDefault && <StarIcon fontSize="small" />}
              </ListItemIcon>
              <Typography variant="inherit">{label}</Typography>
            </MenuItem>
          );
        })}
        ;
      </Select>
      <Button
        variant="contained"
        onClick={handleSubmit}
        style={{ marginTop: 20 }}
      >
        {props.saveLabel ?? "Save"}
      </Button>
    </div>
  );
};

export default compose(
  asSection({
    title: "Messaging Service",
    readinessName: "messagingService",
    jobQueueNames: [],
    expandableBySuperVolunteers: false,
    expandAfterCampaignStarts: false
  })
)(CampaignMessagingServiceForm);
