import React from "react";
import { Switch, Route, Redirect, withRouter } from "react-router-dom";
import gql from "graphql-tag";

import ApolloClientSingleton from "./network/apollo-client-singleton";
import { AuthzProvider } from "./components/AuthzProvider";
import AdminDashboard from "./components/AdminDashboard";
import AdminCampaignList from "./containers/AdminCampaignList";
import AdminCampaignStats from "./containers/AdminCampaignStats";
import AdminPersonList from "./containers/AdminPersonList";
import AdminTeamEditor from "./containers/AdminTeamEditor";
import TeamEditorDetail from "./containers/AdminTeamEditor/TeamEditorDetail";
import AdminAssignmentControl from "./containers/AdminAssignmentControl";
import AdminTagEditor from "./containers/AdminTagEditor";
import AdminOptOutList from "./containers/AdminOptOutList";
import AdminBulkScriptEditor from "./containers/AdminBulkScriptEditor";
import AdminShortLinkDomains from "./containers/AdminShortLinkDomains";
import AdminAssignmentRequest from "./containers/AdminAssignmentRequest";
import AdminTrollAlarms from "./containers/AdminTrollAlarms";
import AdminIncomingMessageList from "./containers/AdminIncomingMessageList";
import EscalatedConversationList from "./containers/AdminIncomingMessageList/EscalatedConversationList";
import AdminCampaignEdit from "./containers/AdminCampaignEdit";
import AdminReplySender from "./containers/AdminReplySender";
import TexterDashboard from "./components/TexterDashboard";
import TopNav from "./components/TopNav";
import DashboardLoader from "./containers/DashboardLoader";
import TexterTodoList from "./containers/TexterTodoList";
import TexterTodo from "./containers/TexterTodo";
import Login from "./components/Login";
import Terms from "./containers/Terms";
import CreateOrganization from "./containers/CreateOrganization";
import JoinTeam from "./containers/JoinTeam";
import Home from "./containers/Home";
import SettingsRouter from "./containers/Settings";
import AdminExternalSystems from "./containers/AdminExternalSystems";
import UserEdit from "./containers/UserEdit";
import TexterFaqs from "./components/TexterFaqs";
import FAQs from "./lib/faqs";

class ProtectedInner extends React.Component {
  state = { isAuthed: false };

  componentDidMount() {
    const { history } = this.props;
    const loginUrl = `/login?nextUrl=${window.location.pathname}`;
    ApolloClientSingleton.query({
      query: gql`
        query currentUser {
          currentUser {
            id
          }
        }
      `
    })
      .then((result) => result.data.currentUser.id)
      .then(() => this.setState({ isAuthed: true }))
      .catch((_err) => history.push(loginUrl));
  }

  render() {
    return this.state.isAuthed ? this.props.children : <div />;
  }
}

const Protected = withRouter(ProtectedInner);

const AuthenticatedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(routeProps) => (
      <Protected>
        <Component {...routeProps} />
      </Protected>
    )}
  />
);

const AdminCampaignRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const campaignPath = "/admin/:organizationId/campaigns/:campaignId";
  return (
    <Switch>
      <Route path={campaignPath} exact={true} component={AdminCampaignStats} />
      <Route path={`${campaignPath}/edit`} component={AdminCampaignEdit} />
      <Route
        path={`${campaignPath}/send-replies`}
        component={AdminReplySender}
      />
      <Redirect to={campaignPath} />
    </Switch>
  );
};

const AdminCampaignListRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const campaignsPath = "/admin/:organizationId/campaigns";
  return (
    <Switch>
      <Route path={campaignsPath} exact={true} component={AdminCampaignList} />
      <Route
        path={`${campaignsPath}/:campaignId`}
        component={AdminCampaignRoutes}
      />
      <Redirect to={campaignsPath} />
    </Switch>
  );
};

const AdminTeamRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const teamsPath = "/admin/:organizationId/teams";
  return (
    <Switch>
      <Route path={teamsPath} exact={true} component={AdminTeamEditor} />
      <Route path={`${teamsPath}/:teamId`} component={TeamEditorDetail} />
      <Redirect to={teamsPath} />
    </Switch>
  );
};

const AdminOrganizationRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const organizationPath = "/admin/:organizationId";
  const { organizationId } = props.match.params;
  return (
    <AuthzProvider organizationId={organizationId}>
      <AdminDashboard {...props}>
        <Switch>
          <Route
            path={`${organizationPath}/campaigns`}
            component={AdminCampaignListRoutes}
          />
          <Route
            path={`${organizationPath}/people`}
            component={AdminPersonList}
          />
          <Route
            path={`${organizationPath}/teams`}
            component={AdminTeamRoutes}
          />
          <Route
            path={`${organizationPath}/assignment-control`}
            component={AdminAssignmentControl}
          />
          <Route
            path={`${organizationPath}/tag-editor`}
            component={AdminTagEditor}
          />
          <Route
            path={`${organizationPath}/optouts`}
            component={AdminOptOutList}
          />
          <Route
            path={`${organizationPath}/incoming`}
            component={AdminIncomingMessageList}
          />
          <Route
            path={`${organizationPath}/escalated`}
            component={EscalatedConversationList}
          />
          <Route
            path={`${organizationPath}/bulk-script-editor`}
            component={AdminBulkScriptEditor}
          />
          <Route
            path={`${organizationPath}/short-link-domains`}
            component={AdminShortLinkDomains}
          />
          <Route
            path={`${organizationPath}/assignment-requests`}
            component={AdminAssignmentRequest}
          />
          <Route
            path={`${organizationPath}/trollalarms`}
            component={AdminTrollAlarms}
          />
          <Route
            path={`${organizationPath}/integrations`}
            component={AdminExternalSystems}
          />
          <Redirect
            exact={true}
            path={`${organizationPath}/settings`}
            to={`${organizationPath}/settings/general`}
          />
          <Route
            path={`${organizationPath}/settings/:page`}
            component={SettingsRouter}
          />
          <Redirect to={`${organizationPath}/campaigns`} />
        </Switch>
      </AdminDashboard>
    </AuthzProvider>
  );
};

const AdminRoutes = ({ match }) => (
  <Switch>
    <Route
      path={match.path}
      exact={true}
      render={(indexProps) => (
        <DashboardLoader path={match.path} {...indexProps} />
      )}
    />
    <Route
      path={`${match.path}/:organizationId`}
      component={AdminOrganizationRoutes}
    />
    <Redirect to={match.path} />
  </Switch>
);

const TexterDashboardRoute = (props) => {
  const { children, main, topNav, fullScreen, ...rest } = props;
  return (
    <Route
      {...rest}
      render={(routeProps) => (
        <TexterDashboard
          main={main}
          topNav={topNav}
          fullScreen={fullScreen}
          {...routeProps}
        >
          {children}
        </TexterDashboard>
      )}
    />
  );
};

const TexterAssignmentRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const assignmentPath = "/app/:organizationId/todos/:assignmentId";
  return (
    <Switch>
      <TexterDashboardRoute
        path={`${assignmentPath}/text`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="needsMessage" {...routeProups} />
        )}
      />
      <TexterDashboardRoute
        path={`${assignmentPath}/reply`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="needsResponse" {...routeProups} />
        )}
        topNav={undefined}
      />
      <TexterDashboardRoute
        path={`${assignmentPath}/stale`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="convo" {...routeProups} />
        )}
        topNav={undefined}
      />
      <TexterDashboardRoute
        path={`${assignmentPath}/skipped`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="closed" {...routeProups} />
        )}
        topNav={undefined}
      />
      <TexterDashboardRoute
        path={`${assignmentPath}/all`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="needsMessageOrResponse" {...routeProups} />
        )}
        topNav={undefined}
      />
      <Redirect to={`${assignmentPath}/text`} />
    </Switch>
  );
};

const TexterTodoRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const todosPath = "/app/:organizationId/todos";
  return (
    <Switch>
      <TexterDashboardRoute
        path={todosPath}
        exact={true}
        main={TexterTodoList}
        topNav={({ match }) => (
          <TopNav title="Texting" orgId={match.params.organizationId} />
        )}
      />
      <Route
        path={`${todosPath}/:assignmentId`}
        component={TexterAssignmentRoutes}
      />
    </Switch>
  );
};

const TexterOrganizationRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const organizationPath = "/app/:organizationId";
  const { organizationId } = props.match.params;
  return (
    <AuthzProvider organizationId={organizationId}>
      <Switch>
        <TexterDashboardRoute
          path={`${organizationPath}/faqs`}
          main={() => <TexterFaqs faqs={FAQs} />}
          topNav={({ match }) => (
            <TopNav title="FAQs" orgId={match.params.organizationId} />
          )}
        />
        <TexterDashboardRoute
          path={`${organizationPath}/account/:userId`}
          main={({ match }) => (
            <UserEdit
              userId={match.params.userId}
              organizationId={match.params.organizationId}
            />
          )}
          topNav={({ match }) => (
            <TopNav title="Account" orgId={match.params.organizationId} />
          )}
        />

        <Route
          path={`${organizationPath}/todos`}
          component={TexterTodoRoutes}
        />

        <Redirect to={`${organizationPath}/todos`} />
      </Switch>
    </AuthzProvider>
  );
};

const TexterRoutes = ({ match }) => (
  <Switch>
    <Route
      path={match.path}
      exact={true}
      render={() => <DashboardLoader path={match.path} />}
    />
    <Route
      path={`${match.path}/:organizationId`}
      component={TexterOrganizationRoutes}
    />
    <Redirect to={match.path} />
  </Switch>
);

const AppRoutes = () => (
  <Switch>
    <Route path="/" exact={true} component={Home} />
    <Route path="/login" component={Login} />
    <Route path="/terms" component={Terms} />
    <Route
      path="/reset/:resetHash"
      render={({ location }) => (
        <Redirect to={`/login?nextUrl=${location.pathname}`} />
      )}
    />
    <AuthenticatedRoute path="/admin" component={AdminRoutes} />
    <AuthenticatedRoute path="/app" component={TexterRoutes} />
    <AuthenticatedRoute
      path="/invite/:inviteId"
      component={CreateOrganization}
    />
    <AuthenticatedRoute
      path="/:organizationUuid/join"
      exact={true}
      component={JoinTeam}
    />
    <AuthenticatedRoute
      path="/:organizationUuid/join/:campaignId"
      component={JoinTeam}
    />
  </Switch>
);

export default AppRoutes;
