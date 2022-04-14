/* eslint-disable react/no-unstable-nested-components */
import { gql } from "@apollo/client";
import React from "react";
import { Redirect, Route, Routes } from "react-router-dom";
import { withRouter } from "./components/ClassRouter";

import AdminDashboard from "./components/AdminDashboard";
import { AuthzProvider } from "./components/AuthzProvider";
import Login from "./components/Login";
import TexterDashboard from "./components/TexterDashboard";
import TopNav from "./components/TopNav";
import AdminAssignmentControl from "./containers/AdminAssignmentControl";
import AdminAssignmentRequest from "./containers/AdminAssignmentRequest";
import AdminAutosending from "./containers/AdminAutosending";
import AdminBulkScriptEditor from "./containers/AdminBulkScriptEditor";
import AdminCampaignEdit from "./containers/AdminCampaignEdit";
import AdminCampaignGroupEditor from "./containers/AdminCampaignGroupEditor";
import AdminCampaignList from "./containers/AdminCampaignList";
import AdminCampaignStats from "./containers/AdminCampaignStats";
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
import AdminTrollAlarms from "./containers/AdminTrollAlarms";
import CreateOrganization from "./containers/CreateOrganization";
import DashboardLoader from "./containers/DashboardLoader";
import Home from "./containers/Home";
import JoinTeam from "./containers/JoinTeam";
import SettingsRouter from "./containers/Settings";
import Terms from "./containers/Terms";
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
    <Routes>
      <Route path={campaignPath} exact>
        <AdminCampaignStats />
      </Route>
      <Route path={`${campaignPath}/edit`}>
        <AdminCampaignEdit />
      </Route>
      <Route path={`${campaignPath}/send-replies`}>
        <AdminReplySender />
      </Route>
      <Redirect to={campaignPath} />
    </Routes>
  );
};

const AdminCampaignListRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const campaignsPath = "/admin/:organizationId/campaigns";
  return (
    <Routes>
      <Route path={campaignsPath} exact>
        <AdminCampaignList />
      </Route>
      <Route path={`${campaignsPath}/:campaignId`}>
        <AdminCampaignRoutes />
      </Route>
      <Redirect to={campaignsPath} />
    </Routes>
  );
};

const AdminTeamRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const teamsPath = "/admin/:organizationId/teams";
  return (
    <Routes>
      <Route path={teamsPath} exact>
        <AdminTeamEditor />
      </Route>
      <Route path={`${teamsPath}/:teamId`}>
        <TeamEditorDetail />
      </Route>
      <Redirect to={teamsPath} />
    </Routes>
  );
};

const AdminOrganizationRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const organizationPath = "/admin/:organizationId";
  const { organizationId } = props.match.params;
  return (
    <AuthzProvider organizationId={organizationId}>
      <AdminDashboard {...props}>
        <Routes>
          <Route path={`${organizationPath}/campaigns`}>
            <AdminCampaignListRoutes />
          </Route>
          <Route path={`${organizationPath}/campaign-groups`}>
            <AdminCampaignGroupEditor />
          </Route>
          <Route path={`${organizationPath}/people`}>
            <AdminPeople />
          </Route>
          <Route path={`${organizationPath}/teams`}>
            <AdminTeamRoutes />
          </Route>
          <Route path={`${organizationPath}/assignment-control`}>
            <AdminAssignmentControl />
          </Route>
          <Route path={`${organizationPath}/autosending`}>
            <AdminAutosending />
          </Route>
          <Route path={`${organizationPath}/tag-editor`}>
            <AdminTagEditor />
          </Route>
          <Route path={`${organizationPath}/optouts`}>
            <AdminOptOutList />
          </Route>
          <Route path={`${organizationPath}/incoming`}>
            <AdminIncomingMessageList />
          </Route>
          <Route path={`${organizationPath}/escalated`}>
            <EscalatedConversationList />
          </Route>
          <Route path={`${organizationPath}/bulk-script-editor`}>
            <AdminBulkScriptEditor />
          </Route>
          <Route path={`${organizationPath}/short-link-domains`}>
            <AdminShortLinkDomains />
          </Route>
          <Route path={`${organizationPath}/assignment-requests`}>
            <AdminAssignmentRequest />
          </Route>
          <Route path={`${organizationPath}/trollalarms`}>
            <AdminTrollAlarms />
          </Route>
          <Route exact path={`${organizationPath}/integrations`}>
            <AdminExternalSystems />
          </Route>
          <Route path={`${organizationPath}/integrations/:systemId`}>
            <AdminExternalSystemDetail />
          </Route>
          <Redirect
            exact
            path={`${organizationPath}/settings`}
            to={`${organizationPath}/settings/general`}
          />
          <Route path={`${organizationPath}/settings/:page`}>
            <SettingsRouter />
          </Route>
          <Redirect to={`${organizationPath}/campaigns`} />
        </Routes>
      </AdminDashboard>
    </AuthzProvider>
  );
};

const AdminRoutes = ({ match }) => (
  <Routes>
    <Route
      path={match.path}
      exact
      render={(indexProps) => (
        <DashboardLoader path={match.path} {...indexProps} />
      )}
    />
    <Route path={`${match.path}/:organizationId`}>
      <AdminOrganizationRoutes />
    </Route>
    <Redirect to={match.path} />
  </Routes>
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

const TexterAssignmentRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const assignmentPath = "/app/:organizationId/todos/:assignmentId";
  return (
    <Routes>
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
    </Routes>
  );
};

const TexterTodoRoutes = () => {
  // Use full path over props.match.path to get access to organizationId param
  const todosPath = "/app/:organizationId/todos";
  return (
    <Routes>
      <TexterDashboardRoute
        path={todosPath}
        exact
        main={TexterTodoList}
        topNav={({ match }) => (
          <TopNav title="Texting" orgId={match.params.organizationId} />
        )}
      />
      <Route path={`${todosPath}/:assignmentId`}>
        <TexterAssignmentRoutes />
      </Route>
    </Routes>
  );
};

const TexterOrganizationRoutes = (props) => {
  // Use full path over props.match.path to get access to organizationId param
  const organizationPath = "/app/:organizationId";
  const { organizationId } = props.match.params;
  return (
    <AuthzProvider organizationId={organizationId}>
      <Routes>
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

        <Route path={`${organizationPath}/todos`}>
          <TexterTodoRoutes />
        </Route>

        <Redirect to={`${organizationPath}/todos`} />
      </Routes>
    </AuthzProvider>
  );
};

const TexterRoutes = ({ match }) => (
  <Routes>
    <Route
      path={match.path}
      exact
      render={() => <DashboardLoader path={match.path} />}
    />
    <Route path={`${match.path}/:organizationId`}>
      <TexterOrganizationRoutes />
    </Route>
    <Redirect to={match.path} />
  </Routes>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" exact>
      <Home />
    </Route>
    <Route path="/login">
      <Login />
    </Route>
    <Route path="/terms">
      <Terms />
    </Route>
    <Route
      path="/reset/:resetHash"
      render={({ location }) => (
        <Redirect to={`/login?nextUrl=${location.pathname}`} />
      )}
    />
    <Route path="/email-reset">
      <Login />
    </Route>
    <AuthenticatedRoute path="/admin" component={AdminRoutes} />
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
  </Routes>
);

export default AppRoutes;
