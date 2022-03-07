import { gql } from "@apollo/client";
import React from "react";

import { Campaign, CampaignsFilter } from "../../api/campaign";
import LoadingIndicator from "../../components/LoadingIndicator";
import apolloClient from "../../network/apollo-client-singleton";
import CampaignList from "./CampaignList";

const query = gql`
  query adminGetCampaigns(
    $organizationId: String!
    $limit: Int
    $after: Cursor
    $filter: CampaignsFilter
  ) {
    organization(id: $organizationId) {
      id
      campaignsRelay(first: $limit, after: $after, filter: $filter) {
        pageInfo {
          totalCount
          endCursor
          hasNextPage
        }
        edges {
          cursor
          node {
            id
            title
            isStarted
            isApproved
            isArchived
            isAutoassignEnabled
            hasUnassignedContacts
            hasUnsentInitialMessages
            hasUnhandledMessages
            description
            dueBy
            creator {
              displayName
            }
            teams {
              id
              title
            }
            campaignGroups {
              edges {
                node {
                  id
                  name
                }
              }
            }
            externalSystem {
              id
              type
              name
            }
          }
        }
      }
    }
  }
`;

interface Props {
  organizationId: string;
  pageSize: number;
  campaignsFilter: CampaignsFilter;
  isAdmin: boolean;
  startOperation: (...args: any[]) => any;
  archiveCampaign: (...args: any[]) => any;
  unarchiveCampaign: (...args: any[]) => any;
}

interface State {
  cursor?: string;
  hasNextPage: boolean;
  campaigns: Campaign[];
  loading: boolean;
  prevY: number;
  error?: string;
}

export class CampaignListLoader extends React.Component<Props, State> {
  observer?: IntersectionObserver;

  loadingRef: any;

  state: State = {
    campaigns: [],
    prevY: 0,
    hasNextPage: false,
    loading: false
  };

  componentDidMount() {
    this.getCampaigns();

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0
    };

    this.observer = new IntersectionObserver(this.handleObserver, options);
    this.observer.observe(this.loadingRef);
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.organizationId !== this.props.organizationId ||
      prevProps.campaignsFilter.isArchived !==
        this.props.campaignsFilter.isArchived ||
      prevProps.pageSize !== this.props.pageSize
    ) {
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.campaigns = [];
      this.getCampaigns();
    }
  }

  handleObserver = (entities: any[], _observer: IntersectionObserver) => {
    const { prevY, hasNextPage, cursor, loading } = this.state;
    const { y } = entities[0].boundingClientRect;
    if (prevY > y && hasNextPage && !loading) {
      this.getCampaigns(cursor);
    }
    this.setState({ prevY: y });
  };

  getCampaigns = async (after?: string) => {
    this.setState({ loading: true, error: undefined });

    try {
      const {
        pageSize,
        organizationId,
        campaignsFilter: { isArchived }
      } = this.props;

      const result = await apolloClient.query({
        query,
        variables: {
          ...(pageSize > 0 ? { limit: pageSize } : {}),
          organizationId,
          after,
          filter: {
            isArchived
          }
        },
        fetchPolicy: "network-only"
      });
      const {
        edges,
        pageInfo: { endCursor, hasNextPage }
      } = result.data.organization.campaignsRelay;
      const newCampaigns = edges.map(({ node }: { node: Campaign }) => node);
      const campaigns = [...this.state.campaigns, ...newCampaigns];
      this.setState({ campaigns, cursor: endCursor, hasNextPage });
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const {
      organizationId,
      isAdmin,
      startOperation,
      archiveCampaign,
      unarchiveCampaign
    } = this.props;

    const { campaigns, loading, error } = this.state;

    return (
      <div>
        {error && <p>Error fetching campaigns: {error}</p>}
        <CampaignList
          organizationId={organizationId}
          campaigns={campaigns}
          isAdmin={isAdmin}
          startOperation={startOperation}
          archiveCampaign={archiveCampaign}
          unarchiveCampaign={unarchiveCampaign}
        />
        {loading && <LoadingIndicator />}
        <div
          ref={(loadingRef) => {
            this.loadingRef = loadingRef;
          }}
        />
      </div>
    );
  }
}

export default CampaignListLoader;
