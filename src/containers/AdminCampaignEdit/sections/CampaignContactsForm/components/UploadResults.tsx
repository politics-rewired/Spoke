import Collapse from "@material-ui/core/Collapse";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import React, { useState } from "react";

import { dataTest } from "../../../../../lib/attributes";
import { PendingJobType } from "../../../components/SectionWrapper";

const GreenCheck = () => {
  const theme = useTheme();
  return <CheckCircleIcon style={{ color: theme.palette.success.main }} />;
};

const useStyles = makeStyles((theme) => ({
  nested: {
    paddingLeft: theme.spacing(4),
    fontSize: "12px"
  }
}));

interface UploadResultsProps {
  contactsCount: number;
  customFields: string[];
  pendingJob?: PendingJobType;
}

export const UploadResults: React.FC<UploadResultsProps> = (props) => {
  const { contactsCount, customFields, pendingJob } = props;
  const [open, setOpen] = useState(false);

  const classes = useStyles();

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <List>
      {contactsCount > 0 && <ListSubheader>Uploaded</ListSubheader>}
      {contactsCount > 0 && (
        <ListItem {...dataTest("uploadedContacts")}>
          <ListItemIcon>
            <GreenCheck />
          </ListItemIcon>
          <ListItemText primary={`${contactsCount} contacts`} />
        </ListItem>
      )}
      {contactsCount > 0 && (
        <>
          <ListItem button onClick={handleClick}>
            <ListItemIcon>
              <GreenCheck />
            </ListItemIcon>
            <ListItemText primary={`${customFields.length} custom fields`} />
            {open ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {customFields.map((field) => (
                <ListItem key={field} className={classes.nested}>
                  <ListItemText primary={field} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </>
      )}
      {pendingJob && <ListSubheader>Upload Messages</ListSubheader>}
      {pendingJob && pendingJob.resultMessage.split("\n").length > 0
        ? pendingJob.resultMessage.split("\n").map((message) => (
            <ListItem key={message}>
              <ListItemText primary={message} />
            </ListItem>
          ))
        : ""}
    </List>
  );
};

export default UploadResults;
