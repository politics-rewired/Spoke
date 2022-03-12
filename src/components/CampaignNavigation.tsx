import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import { css, StyleSheet } from "aphrodite";
import React from "react";

import { useGetCampaignNavigationQuery } from "../../libs/spoke-codegen/src";

interface Props {
  prevCampaignClicked(campaignId: string | null): void;
  nextCampaignClicked(campaignId: string | null): void;
  campaignId: string;
  campaignNavigation: {
    campaignNavigation: {
      prevCampaignId: string | null;
      nextCampaignId: string | null;
    };
  };
}

const styles = StyleSheet.create({
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 20,
    paddingBottom: 20,
    flexWrap: "wrap"
  }
});

const CampaignNavigation: React.FC<Props> = (props) => {
  const { data, loading } = useGetCampaignNavigationQuery({
    variables: { campaignId: props.campaignId }
  });

  if (loading) {
    return (
      <div className={css(styles.buttonContainer)}>
        <ButtonGroup disableElevation variant="contained" color="primary">
          <Button disabled>Previous</Button>
          <Button disabled>Next</Button>
        </ButtonGroup>
      </div>
    );
  }
  const campaignNavigation = data?.campaignNavigation;

  return (
    <div className={css(styles.buttonContainer)}>
      <ButtonGroup disableElevation variant="contained" color="primary">
        <Button
          disabled={!campaignNavigation?.prevCampaignId}
          onClick={() => {
            props.prevCampaignClicked(
              campaignNavigation?.prevCampaignId || null
            );
          }}
        >
          Previous
        </Button>
        <Button
          disabled={!campaignNavigation?.nextCampaignId}
          onClick={() => {
            props.nextCampaignClicked(
              campaignNavigation?.nextCampaignId || null
            );
          }}
        >
          Next
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default CampaignNavigation;
