import { OperationOption } from "react-apollo";
import { MutationOptions } from "apollo-client";

export interface QueryMap<OuterProps> {
  [key: string]: { query: any } & OperationOption<OuterProps, any, any, any>;
}

export type MutationCreator<OuterProps> = (
  ownProps: OuterProps
) => (...args: any[]) => MutationOptions;

export interface MutationMap<OuterProps> {
  [key: string]: MutationCreator<OuterProps>;
}
