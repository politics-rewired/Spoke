import { FetchPolicy } from "apollo-client";
import produce, { Draft } from "immer";
import React from "react";
import { Query } from "react-apollo";

import { emptyRelayPage, RelayPaginatedResponse } from "../api/pagination";
import ChildOnly from "./ChildOnly";
import WhenSeen from "./WhenSeen";

export type CliffHanger<T> = (
  hasMore: boolean,
  last: RelayPaginatedResponse<T>
) => React.ReactElement;

export type UpdateQuery<TData, TVariables> = (
  nextQueryResult: Draft<TData>,
  options: {
    fetchMoreResult?: TData;
    variables?: TVariables;
  }
) => void;

interface InfiniteRelayListProps<TData, TNode, TVariables> {
  query: any;
  queryVars: TVariables;
  nextQueryVars(cursor: string | null): TVariables;
  updateQuery: UpdateQuery<TData, TVariables>;
  renderNode: (node: TNode, idx: number) => React.ReactElement;
  toRelay: (data: TData) => RelayPaginatedResponse<TNode>;
  keyFunc?: (node: TNode, idx: number) => any;
  cliffHanger?: CliffHanger<TNode>;
  empty?: () => React.ReactElement;
  fetchPolicy?: FetchPolicy;
}

const DefaultCliffhanger: CliffHanger<any> = () => (
  <div>
    <span role="img" aria-label="end of list">
      😳 End of list 😳
    </span>
  </div>
);

const DefaultEmpty = () => <div>No items found</div>;

const InfiniteRelayList = <TData, TNode, TVariables>(
  props: InfiniteRelayListProps<TData, TNode, TVariables>
) => {
  const Empty = props.empty || DefaultEmpty;
  const cliffHanger = props.cliffHanger || DefaultCliffhanger;

  return (
    <Query<TData, TVariables>
      query={props.query}
      variables={props.queryVars}
      fetchPolicy={props.fetchPolicy || "network-only"}
    >
      {({ data, loading, fetchMore }): React.ReactNode => {
        if (loading || !data) return <div />;

        const relayPage = data ? props.toRelay(data) : emptyRelayPage<TNode>();

        if (relayPage.edges.length === 0 && !loading) {
          return <Empty />;
        }

        const onLoadMore = () =>
          fetchMore({
            variables: {
              ...props.queryVars,
              ...props.nextQueryVars(relayPage.pageInfo.endCursor)
            },
            updateQuery: (previousQueryResult, options) =>
              produce(previousQueryResult, (nextResult) => {
                props.updateQuery(nextResult, options);
              })
          });

        return (
          <div>
            {relayPage.edges.map(({ node }, idx) => (
              <ChildOnly key={(props.keyFunc || ((_, i) => i))(node, idx)}>
                {props.renderNode(node, idx)}
              </ChildOnly>
            ))}
            <WhenSeen onSeenChange={(isSeen) => isSeen && onLoadMore()}>
              {cliffHanger(relayPage.pageInfo.hasNextPage, relayPage)}
            </WhenSeen>
          </div>
        );
      }}
    </Query>
  );
};

export default InfiniteRelayList;
