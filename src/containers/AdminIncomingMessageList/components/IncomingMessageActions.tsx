import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Collapse from "@material-ui/core/Collapse";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import FormControl from "@material-ui/core/FormControl";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import { css, StyleSheet } from "aphrodite";
import React, { useState } from "react";

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%"
  },
  buttonGroup: {
    marginTop: 20,
    width: "50%"
  }
});

type Texter = {
  displayName: string;
  email: string;
  role: string;
  id: number;
};

const formatTexter = (texter: Texter) => {
  const { displayName, email, role } = texter;
  return `${displayName} (${email}) ${role}`;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index } = props;

  return (
    <div role="tabpanel" hidden={value !== index}>
      <Box p={3}>{children}</Box>
    </div>
  );
};

interface IncomingMessageActionsProps {
  people: Array<any>;
  contactsAreSelected: boolean;
  conversationCount: number;
  onReassignRequested(texterIds: string[]): void;
  onReassignAllMatchingRequested(texterIds: string[]): void;
  onUnassignRequested(): void;
  onUnassignAllMatchingRequested(): void;
  markForSecondPass(): void;
}

const IncomingMessageActions: React.FC<IncomingMessageActionsProps> = (
  props
) => {
  const [selectedTexters, setSelectedTexters] = useState<Array<string>>([]);
  const [reassignDialogOpen, setReassignDialogOpen] = useState<boolean>(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState<boolean>(false);
  const [showSection, setShowSection] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleExpandChange = () => {
    setShowSection(!showSection);
  };

  const onReassignmentClicked = () => {
    props.onReassignRequested(selectedTexters);
  };

  const onUnassignClicked = () => {
    props.onUnassignRequested();
  };

  const onReassignAllMatchingClicked = () => {
    setReassignDialogOpen(true);
  };

  const onUnassignAllMatchingClicked = () => {
    setUnassignDialogOpen(true);
  };

  const handleTextersChanged = (
    event: React.ChangeEvent<{ value: unknown }>,
    _child: React.ReactNode
  ) => {
    setSelectedTexters(event.target.value as string[]);
  };

  const handleConfirmDialogCancel = () => {
    setUnassignDialogOpen(false);
    setReassignDialogOpen(false);
  };

  const handleConfirmDialogReassign = () => {
    setReassignDialogOpen(false);
    props.onReassignAllMatchingRequested(selectedTexters);
  };

  const handleConfirmDialogUnassign = () => {
    setUnassignDialogOpen(false);
    props.onUnassignAllMatchingRequested();
  };

  let texters = props.people ?? [];
  texters = texters.map((texter) => ({
    value: texter.id,
    label: formatTexter(texter)
  }));

  const confirmDialogActions = (
    actionVerb: string,
    confirmAction: () => void
  ) => [
    <Button onClick={handleConfirmDialogCancel} key={`${actionVerb}-cancel`}>
      Cancel
    </Button>,
    <Button key={`${actionVerb}-confirm`} onClick={confirmAction}>
      {actionVerb || "Reassign"}
    </Button>
  ];

  const onChangeActiveTab = (
    _event: React.ChangeEvent<any>,
    newValue: number
  ) => {
    setActiveTab(newValue);
  };

  const { contactsAreSelected, conversationCount } = props;
  const hasSelectedTexters = selectedTexters.length > 0;
  return (
    <Card>
      <CardHeader
        title="Message Actions"
        action={
          <IconButton onClick={handleExpandChange}>
            {showSection ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />
      <Collapse in={showSection}>
        <CardContent>
          <AppBar position="static">
            <Tabs
              value={activeTab}
              onChange={onChangeActiveTab}
              indicatorColor="secondary"
              variant="fullWidth"
            >
              <Tab label="Reassign" />
              <Tab label="Unassign" />
            </Tabs>
          </AppBar>
          <TabPanel value={activeTab} index={0}>
            <FormControl className={css(styles.fullWidth)}>
              <InputLabel id="texter-reassign-input-label">
                Select at least one texter
              </InputLabel>
              <Select
                multiple
                value={selectedTexters}
                onChange={handleTextersChanged}
                renderValue={(selected) =>
                  (selected as string[])
                    .map(
                      (texterId) =>
                        texters.find((texter) => texter.value === texterId)
                          .label
                    )
                    .join(", ")
                }
              >
                {texters.map(({ value, label }) => {
                  return (
                    <MenuItem key={value} value={value}>
                      <ListItemText primary={label} />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <ButtonGroup color="primary" className={css(styles.buttonGroup)}>
              <Button
                disabled={!contactsAreSelected || !hasSelectedTexters}
                onClick={onReassignmentClicked}
              >
                Reassign Selected
              </Button>
              <Button
                disabled={conversationCount === 0 || !hasSelectedTexters}
                onClick={onReassignAllMatchingClicked}
              >
                Reassign all {conversationCount} matching
              </Button>
            </ButtonGroup>
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <ButtonGroup color="primary" className={css(styles.buttonGroup)}>
              <Button
                disabled={!contactsAreSelected}
                onClick={onUnassignClicked}
              >
                Unassign Selected
              </Button>
              <Button
                disabled={conversationCount === 0}
                onClick={onUnassignAllMatchingClicked}
              >
                Unassign all {conversationCount} matching
              </Button>
            </ButtonGroup>
          </TabPanel>
        </CardContent>
      </Collapse>
      <Dialog
        open={reassignDialogOpen}
        disableEscapeKeyDown
        disableBackdropClick
        onClose={handleConfirmDialogCancel}
      >
        <DialogContent>
          <DialogContentText>
            {`Reassign all ${conversationCount} matching conversations?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {confirmDialogActions("Reassign", handleConfirmDialogReassign)}
        </DialogActions>
      </Dialog>
      <Dialog
        open={unassignDialogOpen}
        disableBackdropClick
        disableEscapeKeyDown
        onClose={handleConfirmDialogCancel}
      >
        <DialogContent>
          <DialogContentText>
            {`Unassign all ${conversationCount} matching conversations?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {confirmDialogActions("Unassign", handleConfirmDialogUnassign)}
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default IncomingMessageActions;
