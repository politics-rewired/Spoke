import type {
  DocumentNode,
  FetchPolicy,
  TypedDocumentNode
} from "@apollo/client";
import { useQuery } from "@apollo/client";
import type { Draft } from "immer";
import produce from "immer";
import React from "react";

import type { RelayPaginatedResponse } from "../../../api/pagination";
import { emptyRelayPage } from "../../../api/pagination";
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
  query: DocumentNode | TypedDocumentNode<TData, TVariables>;
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

  const { data, loading, fetchMore } = useQuery<TData, TVariables>(
    props.query,
    {
      variables: props.queryVars,
      fetchPolicy: props.fetchPolicy || "network-only"
    }
  );

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
    <>
      {relayPage.edges.map(({ node }, idx) => (
        <ChildOnly key={(props.keyFunc || ((_, i) => i))(node, idx)}>
          {props.renderNode(node, idx)}
        </ChildOnly>
      ))}
      <WhenSeen
        onSeenChange={(isSeen) =>
          isSeen && relayPage.pageInfo.hasNextPage && onLoadMore()
        }
      >
        {cliffHanger(relayPage.pageInfo.hasNextPage, relayPage)}
      </WhenSeen>
    </>
  );
};

export default InfiniteRelayList;
