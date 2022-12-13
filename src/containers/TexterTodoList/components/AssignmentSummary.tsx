import { makeStyles } from "@material-ui/core";
import CardActions from "@material-ui/core/CardActions";
import Divider from "@material-ui/core/Divider";
import type { Assignment } from "@spoke/spoke-codegen ";
import { Card, CardTitle } from "material-ui/Card";
import React from "react";
import { useHistory } from "react-router-dom";

import { useSpokeContext } from "../../../client/spoke-context";
import { DateTime } from "../../../lib/datetime";
import type { MessageType } from "./BadgeButton";
import BadgeButton from "./BadgeButton";

const useStyles = makeStyles((theme) => ({
  cardActions: {
    "& > :not(:first-child)": {
      marginLeft: theme.spacing(2)
    }
  },
  container: {
    margin: "20px 0"
  },
  image: {
    position: "absolute",
    height: "70%",
    top: "20px",
    right: "20px"
  }
}));

interface Props {
  organizationId: string;
  assignment: Pick<Assignment, "id" | "maxContacts" | "campaign">;
  data: any;
  mutations: any;
  unmessagedCount: number;
  unrepliedCount: number;
  badTimezoneCount: number;
  totalMessagedCount: number;
  pastMessagesCount: number;
  skippedMessagesCount: number;
}

export const AssignmentSummary: React.FC<Props> = (props) => {
  const history = useHistory();
  const context = useSpokeContext();

  const makeGoToTodosHandler = (
    contactsFilter: string | null,
    assignmentId: string
  ) => () => {
    const { organizationId } = props;

    if (contactsFilter) {
      history.push(
        `/app/${organizationId}/todos/${assignmentId}/${contactsFilter}`
      );
    }
  };

  const renderBadgedButton = ({
    dataTestText,
    assignment,
    title,
    count,
    primary,
    disabled,
    contactsFilter,
    hideIfZero,
    type
  }: {
    assignment: Pick<Assignment, "id">;
    contactsFilter: string | null;
    title: string;
    count: number;
    hideIfZero?: boolean;
    dataTestText?: string;
    primary?: boolean;
    disabled?: boolean;
    type?: MessageType;
  }) => {
    return (
      <BadgeButton
        title={title}
        badgeCount={count}
        hideIfZero={hideIfZero}
        primary={primary}
        disabled={disabled}
        dataTestText={dataTestText}
        type={type}
        onClick={makeGoToTodosHandler(contactsFilter, assignment.id)}
      />
    );
  };

  const {
    assignment,
    unmessagedCount,
    unrepliedCount,
    badTimezoneCount,
    pastMessagesCount,
    skippedMessagesCount
  } = props;
  const {
    title,
    description,
    hasUnassignedContacts,
    dueBy,
    primaryColor = context.theme?.defaultCampaignColor,
    logoImageUrl = context.theme?.defaultCampaignLogo,
    introHtml,
    useDynamicAssignment
  } = assignment.campaign;
  const { maxContacts } = assignment;
  const dueByText = dueBy
    ? DateTime.fromISO(dueBy).toFormat("MMM d, yyyy")
    : "No Due Date";
  const subtitle = `${description} - ${dueByText}`;

  const classes = useStyles();

  return (
    <div className={classes.container}>
      <Card key={assignment.id}>
        <CardTitle
          title={title}
          subtitle={subtitle}
          style={{ backgroundColor: primaryColor }}
        >
          {logoImageUrl && <img src={logoImageUrl} className={classes.image} />}
        </CardTitle>
        <Divider />
        <div style={{ margin: "20px" }}>
          <div dangerouslySetInnerHTML={{ __html: introHtml || "" }} />
        </div>
        <CardActions className={classes.cardActions}>
          {window.NOT_IN_USA && window.ALLOW_SEND_ALL
            ? ""
            : renderBadgedButton({
                dataTestText: "sendFirstTexts",
                assignment,
                title: "Send first texts",
                type: "initial",
                count: unmessagedCount,
                primary: true,
                disabled:
                  (useDynamicAssignment &&
                    !hasUnassignedContacts &&
                    unmessagedCount === 0) ||
                  (useDynamicAssignment && maxContacts === 0) ||
                  undefined,
                contactsFilter: "text",
                hideIfZero: !useDynamicAssignment
              })}
          {window.NOT_IN_USA && window.ALLOW_SEND_ALL
            ? ""
            : renderBadgedButton({
                dataTestText: "sendReplies",
                assignment,
                title: "Send replies",
                type: "reply",
                count: unrepliedCount,
                primary: false,
                disabled: false,
                contactsFilter: "reply",
                hideIfZero: true
              })}
          {renderBadgedButton({
            assignment,
            title: "Past Messages",
            type: "past",
            count: pastMessagesCount,
            primary: false,
            disabled: false,
            contactsFilter: "stale",
            hideIfZero: true
          })}
          {renderBadgedButton({
            assignment,
            title: "Skipped Messages",
            type: "past",
            count: skippedMessagesCount,
            primary: false,
            disabled: false,
            contactsFilter: "skipped",
            hideIfZero: true
          })}
          {window.NOT_IN_USA && window.ALLOW_SEND_ALL
            ? renderBadgedButton({
                assignment,
                title: "Send messages",
                type: "initial",
                primary: true,
                disabled: false,
                contactsFilter: "all",
                count: 0,
                hideIfZero: false
              })
            : ""}
          {renderBadgedButton({
            assignment,
            title: "Send later",
            type: "initial",
            count: badTimezoneCount,
            primary: false,
            disabled: true,
            contactsFilter: null,
            hideIfZero: true
          })}
        </CardActions>
      </Card>
    </div>
  );
};

export default AssignmentSummary;
