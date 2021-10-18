import { ApolloCache, ApolloClient, MutationOptions } from "@apollo/client";
import { OperationOption } from "@apollo/client/react/hoc";

export interface QueryMap<OuterProps> {
  [key: string]: { query: any } & OperationOption<OuterProps, any, any, any>;
}

export type MutationCreator<OuterProps> = (
  ownProps: OuterProps
) => (...args: any[]) => MutationOptions;

export interface MutationMap<OuterProps> {
  [key: string]: MutationCreator<OuterProps>;
}

export interface LocalResolverContext<TCacheShape extends unknown = any> {
  client: ApolloClient<TCacheShape>;
  cache: ApolloCache<TCacheShape>;
  getCacheKey: (obj: { __typename: string; id: string | number }) => any;
}
