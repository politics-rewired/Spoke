import React from "react";
import gql from "graphql-tag";
import { ApolloQueryResult } from "apollo-client";

import Dialog from "material-ui/Dialog";
import SelectField from "material-ui/SelectField";
import Toggle from "material-ui/Toggle";
import MenuItem from "material-ui/MenuItem";
import FlatButton from "material-ui/FlatButton";

import { loadData } from "../hoc/with-operations";

interface HocProps {
  data: {
    campaign: {
      id: string;
      customFields: string[];
    };
  };
  mutations: {
    exportCampaignForVan(
      vanIdField: string,
      includeUnmessaged: boolean
    ): ApolloQueryResult<any>;
  };
}

interface OuterProps {
  open: boolean;
  campaignId: string;
  onRequestClose(): void;
  onComplete(): void;
}

interface InnerProps extends OuterProps, HocProps {}

interface State {
  vanIdField: string;
  includeUnmessaged: boolean;
}

class VanExportModal extends React.Component<InnerProps, State> {
  state: State = {
    vanIdField: "external_id",
    includeUnmessaged: false
  };

  handleOnConfirm = async () => {
    const { vanIdField, includeUnmessaged } = this.state;
    await this.props.mutations.exportCampaignForVan(
      vanIdField,
      includeUnmessaged
    );
    this.props.onComplete();
  };

  handleOnChangeVanIdField = (
    event: React.SyntheticEvent<{}>,
    index: number,
    vanIdField: string
  ) => this.setState({ vanIdField });

  handleOnToggleIncludeUnmessages = (
    event: React.MouseEvent<{}>,
    includeUnmessaged: boolean
  ) => this.setState({ includeUnmessaged });

  render() {
    const { vanIdField, includeUnmessaged } = this.state;
    const { open, data } = this.props;
    const {
      campaign: { customFields }
    } = data;

    const selections = ["external_id"].concat(customFields);

    const actions = [
      <FlatButton label="Cancel" onClick={this.props.onRequestClose} />,
      <FlatButton
        label="Export"
        primary={true}
        onClick={this.handleOnConfirm}
      />
    ];

    return (
      <Dialog
        open={open}
        title="Export for VAN"
        actions={actions}
        onRequestClose={this.props.onRequestClose}
      >
        This will export data collected from contacts for upload into VAN. For
        more information see{" "}
        <a
          href="https://docs.spokerewired.com/article/97-export-for-upload-to-van"
          target="_blank"
        >
          Export for Upload to VAN
        </a>.
        <br />
        <SelectField
          floatingLabelText="VAN ID field"
          value={vanIdField}
          onChange={this.handleOnChangeVanIdField}
        >
          {selections.map(selection => (
            <MenuItem
              key={selection}
              value={selection}
              primaryText={selection}
            />
          ))}
        </SelectField>
        <br />
        <br />
        <Toggle
          label="Include unmessaged contacts?"
          toggled={includeUnmessaged}
          onToggle={this.handleOnToggleIncludeUnmessages}
        />
      </Dialog>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getCampaignCustomFields($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          customFields
        }
      }
    `,
    options: (ownProps: OuterProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations = {
  exportCampaignForVan: (ownProps: OuterProps) => (
    vanIdField: string,
    includeUnmessaged: boolean
  ) => ({
    mutation: gql`
      mutation exportCampaignForVan($options: CampaignExportInput!) {
        exportCampaign(options: $options) {
          id
        }
      }
    `,
    variables: {
      options: {
        campaignId: ownProps.campaignId,
        exportType: "VAN",
        vanOptions: {
          vanIdField,
          includeUnmessaged
        }
      }
    }
  })
};

export default loadData({ queries, mutations })(VanExportModal);
