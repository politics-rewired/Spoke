import React from "react";
import {
  NavigateFunction,
  Params,
  useNavigate,
  useParams
} from "react-router-dom";

export type WithRouterExtraType = {
  navigate: NavigateFunction;
  match: { params: Readonly<Params<string>> };
};

export const withRouter = <P extends unknown>(
  Component: React.ComponentType<P & WithRouterExtraType>
) => {
  const navigate = useNavigate();
  const params = useParams();
  const match = { params };

  const ComponentWithRouter = (props: P) => (
    <Component {...props} navigate={navigate} match={match} />
  );

  return ComponentWithRouter;
};

export default withRouter;
