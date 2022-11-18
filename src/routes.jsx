/* eslint-disable react/no-unstable-nested-components */
import { gql } from "@apollo/client";
import React from "react";
import { Redirect, Route, Switch, withRouter } from "react-router-dom";

import AdminAssignmentControl from "./containers/AdminAssignmentControl";
import AdminAssignmentRequest from "./containers/AdminAssignmentRequest";
import AdminAutosending from "./containers/AdminAutosending";
import AdminBulkScriptEditor from "./containers/AdminBulkScriptEditor";
import AdminCampaignEdit from "./containers/AdminCampaignEdit";
import AdminCampaignGroupEditor from "./containers/AdminCampaignGroupEditor";
import AdminCampaignList from "./containers/AdminCampaignList";
import AdminCampaignStats from "./containers/AdminCampaignStats";
import AdminDashboard from "./containers/AdminDashboard";
import AdminExternalSystemDetail from "./containers/AdminExternalSystemDetail";
import AdminExternalSystems from "./containers/AdminExternalSystems";
import AdminIncomingMessageList from "./containers/AdminIncomingMessageList";
import EscalatedConversationList from "./containers/AdminIncomingMessageList/EscalatedConversationList";
import AdminOptOutList from "./containers/AdminOptOutList";
import AdminPeople from "./containers/AdminPeople";
import AdminReplySender from "./containers/AdminReplySender";
import AdminShortLinkDomains from "./containers/AdminShortLinkDomains";
import AdminTagEditor from "./containers/AdminTagEditor";
import AdminTeamEditor from "./containers/AdminTeamEditor";
import TeamEditorDetail from "./containers/AdminTeamEditor/TeamEditorDetail";
import AdminTemplateCampaigns from "./containers/AdminTemplateCampaigns";
import AdminTrollAlarms from "./containers/AdminTrollAlarms";
import { AuthzProvider } from "./containers/AuthzProvider";
import CreateOrganization from "./containers/CreateOrganization";
import DashboardLoader from "./containers/DashboardLoader";
import Home from "./containers/Home";
import JoinTeam from "./containers/JoinTeam";
import Login from "./containers/Login";
import SettingsRouter from "./containers/Settings";
import SuperAdminDashboard from "./containers/SuperAdminDashboard";
import SuperAdminOrganizations from "./containers/SuperAdminOrganizations";
import SuperAdminPeople from "./containers/SuperAdminPeople";
import SuperAdminSuperAdmin from "./containers/SuperAdminSuperAdmin";
import Terms from "./containers/Terms";
import TexterDashboard from "./containers/TexterDashboard";
import TexterTodo from "./containers/TexterTodo";
import TexterTodoList from "./containers/TexterTodoList";
import UserEdit from "./containers/UserEdit";
import ApolloClientSingleton from "./network/apollo-client-singleton";

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

const AdminCampaignRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const campaignPath = "/admin/:organizationId/campaigns/:campaignId";
  return (
    <Switch>
      <Route path={campaignPath} exact component={AdminCampaignStats} />
      <Route path={`${campaignPath}/edit`} component={AdminCampaignEdit} />
      <Route
        path={`${campaignPath}/send-replies`}
        component={AdminReplySender}
      />
      <Redirect to={campaignPath} />
    </Switch>
  );
};

const AdminCampaignListRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const campaignsPath = "/admin/:organizationId/campaigns";
  return (
    <Switch>
      <Route path={campaignsPath} exact component={AdminCampaignList} />
      <Route
        path={`${campaignsPath}/:campaignId`}
        component={AdminCampaignRoutes}
      />
      <Redirect to={campaignsPath} />
    </Switch>
  );
};

const AdminTeamRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const teamsPath = "/admin/:organizationId/teams";
  return (
    <Switch>
      <Route path={teamsPath} exact component={AdminTeamEditor} />
      <Route path={`${teamsPath}/:teamId`} component={TeamEditorDetail} />
      <Redirect to={teamsPath} />
    </Switch>
  );
};

const AdminTemplateCampaignRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const templatesPath = "/admin/:organizationId/template-campaigns";
  return (
    <Switch>
      <Route path={templatesPath} exact component={AdminTemplateCampaigns} />
      <Route
        path={`${templatesPath}/:campaignId`}
        component={AdminCampaignEdit}
      />
      <Redirect to={templatesPath} />
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
            path={`${organizationPath}/template-campaigns`}
            component={AdminTemplateCampaignRoutes}
          />
          <Route
            path={`${organizationPath}/campaign-groups`}
            component={AdminCampaignGroupEditor}
          />
          <Route
            path={`${organizationPath}/people`}
            render={(componentProps) => (
              <AdminPeople
                organizationId={organizationId}
                {...componentProps}
              />
            )}
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
            path={`${organizationPath}/autosending`}
            component={AdminAutosending}
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
            exact
            path={`${organizationPath}/integrations`}
            component={AdminExternalSystems}
          />
          <Route
            path={`${organizationPath}/integrations/:systemId`}
            component={AdminExternalSystemDetail}
          />
          <Redirect
            exact
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
      exact
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

const SuperAdminRoutes = ({ match }) => (
  <Switch>
    <AuthzProvider>
      <SuperAdminDashboard>
        <Route
          path={`${match.path}/people`}
          exact
          component={SuperAdminPeople}
        />
        <Route
          exact
          path={`${match.path}/superadmins`}
          component={SuperAdminSuperAdmin}
        />
        <Route
          exact
          path={`${match.path}/organizations`}
          component={SuperAdminOrganizations}
        />
        <Redirect to={`${match.path}/people`} />
      </SuperAdminDashboard>
    </AuthzProvider>
  </Switch>
);

const TexterDashboardRoute = (props) => {
  const { children, main, topNavTitle, fullScreen, ...rest } = props;
  return (
    <Route
      {...rest}
      render={(routeProps) => (
        <TexterDashboard
          main={main}
          topNavTitle={topNavTitle}
          fullScreen={fullScreen}
          {...routeProps}
        >
          {children}
        </TexterDashboard>
      )}
    />
  );
};

const TexterAssignmentRoutes = () => {
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
        topNavTitle={undefined}
      />
      <TexterDashboardRoute
        path={`${assignmentPath}/stale`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="convo" {...routeProups} />
        )}
        topNavTitle={undefined}
      />
      <TexterDashboardRoute
        path={`${assignmentPath}/skipped`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="closed" {...routeProups} />
        )}
        topNavTitle={undefined}
      />
      <TexterDashboardRoute
        path={`${assignmentPath}/all`}
        fullScreen={(routeProups) => (
          <TexterTodo messageStatus="needsMessageOrResponse" {...routeProups} />
        )}
        topNavTitle={undefined}
      />
      <Redirect to={`${assignmentPath}/text`} />
    </Switch>
  );
};

const TexterTodoRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const todosPath = "/app/:organizationId/todos";
  return (
    <Switch>
      <TexterDashboardRoute
        path={todosPath}
        exact
        main={TexterTodoList}
        topNavTitle="Texting"
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
          path={`${organizationPath}/account/:userId`}
          main={({ match }) => (
            <UserEdit
              userId={match.params.userId}
              organizationId={match.params.organizationId}
            />
          )}
          topNavTitle="Account"
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
      exact
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
    <Route path="/" exact component={Home} />
    <Route path="/login" component={Login} />
    <Route path="/terms" component={Terms} />
    <Route
      path="/reset/:resetHash"
      render={({ location }) => (
        <Redirect to={`/login?nextUrl=${location.pathname}`} />
      )}
    />
    <Route path="/email-reset" component={Login} />
    <AuthenticatedRoute path="/admin" component={AdminRoutes} />
    <AuthenticatedRoute path="/superadmin" component={SuperAdminRoutes} />
    <AuthenticatedRoute path="/app" component={TexterRoutes} />
    <AuthenticatedRoute
      path="/invite/:inviteId"
      component={CreateOrganization}
    />
    <AuthenticatedRoute
      path="/:organizationUuid/join"
      exact
      component={JoinTeam}
    />
    <AuthenticatedRoute
      path="/:organizationUuid/join/:campaignId"
      component={JoinTeam}
    />
  </Switch>
);

export default AppRoutes;
