/* eslint-disable no-unused-vars */
import { isEqual } from "lodash";
import React from "react";

import { emptyRelayPage, RelayPaginatedResponse } from "../api/pagination";
import apolloClient from "../network/apollo-client-singleton";
import WhenSeen from "./WhenSeen";

interface InfiniteRelayListProps<T> {
  query: any;
  queryVars: Record<string, any>;
  nextQueryVars(cursor: string | null): Record<string, any>;
  renderNode: (node: T, idx: number) => React.ReactElement;
  toRelay: (data: any) => RelayPaginatedResponse<T>;
  cliffHanger?: (last: RelayPaginatedResponse<T>) => React.ReactElement;
  empty?: () => React.ReactElement;
}

interface InfiniteRelayListState<T> {
  nodes: T[];
  last: RelayPaginatedResponse<T>;
  loading: boolean;
  hasMore: boolean;
}

class InfiniteRelayList<T> extends React.Component<
  InfiniteRelayListProps<T>,
  InfiniteRelayListState<T>
> {
  state: InfiniteRelayListState<T> = {
    nodes: [],
    last: emptyRelayPage<T>(),
    loading: false,
    hasMore: false
  };

  async componentDidMount() {
    await this.load();
  }

  async componentDidUpdate(prevProps) {
    console.log();
    if (
      prevProps.query !== this.props.query ||
      !isEqual(prevProps.queryVars, this.props.queryVars)
      // !eq(prevProps.queryVars, this.props.queryVars)
    ) {
      await this.load();
    }
  }

  async query(
    variables = this.props.queryVars
  ): Promise<RelayPaginatedResponse<T>> {
    const { data } = await apolloClient.query({
      query: this.props.query,
      variables
    });
    return this.props.toRelay(data);
  }

  async load(more = false) {
    if (more && !this.state.hasMore) return;
    this.setState({ loading: true });
    const last = await this.query(
      more
        ? {
            ...this.props.queryVars,
            ...this.props.nextQueryVars(this.state.last.pageInfo.endCursor)
          }
        : this.props.queryVars
    );
    this.setState((prev) => ({
      nodes: (more ? prev.nodes : []).concat(
        last.edges.map((edge) => edge.node)
      ),
      last,
      loading: false,
      hasMore: last.pageInfo.hasNextPage
    }));
  }

  render() {
    if (this.state.nodes.length === 0 && !this.state.loading) {
      return (
        <div>{(this.props.empty || (() => <div>no items found</div>))()}</div>
      );
    }
    return (
      <div>
        {this.state.nodes.map((item, idx) => this.props.renderNode(item, idx))}
        <WhenSeen onSeenChange={(isSeen) => isSeen && this.load(true)}>
          {(
            this.props.cliffHanger ||
            (() => (
              <div>
                <span role="img" aria-label="end of list">
                  😳 end of list 😳
                </span>
              </div>
            ))
          )(this.state.last)}
        </WhenSeen>
      </div>
    );
  }
}
export default InfiniteRelayList;
