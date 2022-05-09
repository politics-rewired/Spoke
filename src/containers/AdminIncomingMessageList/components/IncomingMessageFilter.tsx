import {
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Collapse,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Switch,
  TextField
} from "@material-ui/core";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import Autocomplete, {
  AutocompleteChangeReason
} from "@material-ui/lab/Autocomplete";
import { css, StyleSheet } from "aphrodite";
import React, { useState } from "react";

import { dataSourceItem, DataSourceItemType } from "../../../components/utils";
import { nameComponents } from "../../../lib/attributes";
import { ALL_TEXTERS, UNASSIGNED_TEXTER } from "../../../lib/constants";

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%"
  }
});

export const MESSAGE_STATUSES = {
  all: {
    name: "All",
    children: ["needsResponse", "needsMessage", "convo", "messaged"]
  },
  needsResponse: {
    name: "Needs Texter Response",
    children: []
  },
  needsMessage: {
    name: "Needs First Message",
    children: []
  },
  convo: {
    name: "Active Conversation",
    children: []
  },
  messaged: {
    name: "First Message Sent",
    children: []
  },
  closed: {
    name: "Closed",
    children: []
  }
};

export const CAMPAIGN_TYPE_FILTERS = [{ id: -1, title: "All Campaigns" }];

export const TEXTER_FILTERS = [
  { id: UNASSIGNED_TEXTER, name: "Unassigned" },
  { id: ALL_TEXTERS, name: "All Texters" }
];

const IDLE_KEY_TIME = 500;

type Tag = {
  id: string;
  title: string;
};

type SearchByContactName = {
  firstName?: string | undefined;
  lastName?: string | undefined;
  cellNumber?: string | undefined;
};

interface IncomingMessageFilterProps {
  isTexterFilterable: boolean;
  isIncludeEscalatedFilterable: boolean;
  includeEscalated: boolean;
  includeNotOptedOutConversations: boolean;
  includeOptedOutConversations: boolean;
  includeArchivedCampaigns: boolean;
  includeActiveCampaigns: boolean;
  textersLoadedFraction: number;
  onCampaignChanged(campaignId: number): void;
  onTagsChanged(): void;
  onTexterChanged(texterId: number): void;
  onIncludeEscalatedChanged(): void;
  onActiveCampaignsToggled(): void;
  onArchivedCampaignsToggled(): void;
  onNotOptedOutConversationsToggled(): void;
  onOptedOutConversationsToggled(): void;
  onMessageFilterChanged(messageStatuesString: string): void;
  searchByContactName(contactDetails: SearchByContactName): void;
  campaigns: Array<any>;
  texters: Array<any>;
  assignmentsFilter: { texterId: number };
  tags: Array<Tag>;
  tagsFilter: Array<string>;
}

const IncomingMessageFilter: React.FC<IncomingMessageFilterProps> = (props) => {
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>();
  const [cellNumber, setCellNumber] = useState<string>();
  const [messageFilter, setMessageFilter] = useState<Array<any>>(["all"]);
  const [showSection, setShowSection] = useState<boolean>(false);
  const [timeoutId, setTimeoutId] = useState<any>();

  const onMessageFilterSelectChanged = (
    event: React.ChangeEvent<{ value: unknown }>,
    _child: React.ReactNode
  ) => {
    const values = event.target.value as string[];
    setMessageFilter(values);
    const messageStatuses = new Set();
    values.forEach((value: string) => {
      const { children } = (MESSAGE_STATUSES as any)[value];
      if (children.length > 0) {
        children.forEach((child: string) => messageStatuses.add(child));
      } else {
        messageStatuses.add(value);
      }
    });

    const messageStatusesString = Array.from(messageStatuses).join(",");
    props.onMessageFilterChanged(messageStatusesString);
  };

  const onCampaignSelected = (
    _event: React.ChangeEvent<any>,
    value: DataSourceItemType<number> | null,
    _reason: AutocompleteChangeReason
  ) => {
    let campaignId;
    if (value === null) {
      campaignId = 1;
    } else {
      campaignId = value.rawValue;
    }
    props.onCampaignChanged(campaignId as number);
  };

  const onTexterSelected = (
    _event: React.ChangeEvent<any>,
    value: DataSourceItemType<number> | null,
    _reason: AutocompleteChangeReason
  ) => {
    let texterId;
    if (value === null) {
      texterId = -1;
    } else {
      texterId = value.rawValue;
    }
    props.onTexterChanged(texterId as number);
  };

  const searchByNewContactName = () => {
    props.searchByContactName({ firstName, lastName, cellNumber });
  };

  const onContactNameChanged = (
    event: React.ChangeEvent<{ value: string }>
  ) => {
    const name = event.target.value;
    const {
      firstName: newFirstName,
      lastName: newLastName,
      cellNumber: newCellNumber
    } = nameComponents(name);
    setFirstName(newFirstName);
    setLastName(newLastName);
    setCellNumber(newCellNumber);

    clearTimeout(timeoutId);
    const submitNameUpdateTimeout = setTimeout(
      searchByNewContactName,
      IDLE_KEY_TIME
    );

    setTimeoutId(submitNameUpdateTimeout);
  };

  const handleExpandChange = () => {
    setShowSection(!showSection);
  };

  const texterNodes = TEXTER_FILTERS.map((texterFilter) =>
    dataSourceItem(texterFilter.name, texterFilter.id)
  ).concat(
    !props.texters
      ? []
      : props.texters.map((user) => {
          const userId = parseInt(user.id, 10);
          return dataSourceItem(user.displayName, userId);
        })
  );

  texterNodes.sort((left, right) => {
    return left.text.localeCompare(right.text, "en", { sensitivity: "base" });
  });

  const campaignNodes = CAMPAIGN_TYPE_FILTERS.map((campaignTypeFilter) =>
    dataSourceItem(campaignTypeFilter.title, campaignTypeFilter.id)
  ).concat(
    !props.campaigns
      ? []
      : props.campaigns.map((campaign) => {
          const campaignId = parseInt(campaign.id, 10);
          const campaignDisplay = `${campaignId}: ${campaign.title}`;
          return dataSourceItem(campaignDisplay, campaignId);
        })
  );

  campaignNodes.sort((left, right) => {
    return left.text.localeCompare(right.text, "en", { sensitivity: "base" });
  });

  const renderSwitches = () => {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormControlLabel
              label="Active Campaigns"
              labelPlacement="start"
              control={
                <Switch
                  checked={
                    props.includeActiveCampaigns ||
                    !props.includeArchivedCampaigns
                  }
                  onChange={props.onActiveCampaignsToggled}
                />
              }
            />
          </Grid>
          <Grid item xs={4}>
            <FormControlLabel
              label="Not Opted Out"
              labelPlacement="start"
              control={
                <Switch
                  checked={
                    props.includeNotOptedOutConversations ||
                    !props.includeOptedOutConversations
                  }
                  onChange={props.onNotOptedOutConversationsToggled}
                />
              }
            />
          </Grid>
          <Grid item xs={4}>
            {props.isIncludeEscalatedFilterable && (
              <FormControlLabel
                label="Include Escalated"
                labelPlacement="start"
                control={
                  <Switch
                    checked={props.includeEscalated}
                    onChange={props.onIncludeEscalatedChanged}
                  />
                }
              />
            )}
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormControlLabel
              label="Archived Campaigns"
              labelPlacement="start"
              control={
                <Switch
                  checked={props.includeArchivedCampaigns}
                  onChange={props.onArchivedCampaignsToggled}
                />
              }
            />
          </Grid>
          <Grid item xs={4}>
            <FormControlLabel
              label="Opted Out"
              labelPlacement="start"
              control={
                <Switch
                  checked={props.includeOptedOutConversations}
                  onChange={props.onOptedOutConversationsToggled}
                />
              }
            />
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Card>
      <CardHeader
        title="Message Filter"
        action={
          <IconButton onClick={handleExpandChange}>
            {showSection ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />
      <Collapse in={showSection}>
        <CardContent>
          {renderSwitches()}
          <Grid container spacing={5} style={{ marginTop: 10 }}>
            <Grid item xs={4}>
              <FormControl className={css(styles.fullWidth)}>
                <InputLabel id="message-filter-label">
                  Contact Message Status
                </InputLabel>
                <Select
                  multiple
                  value={messageFilter ?? []}
                  onChange={onMessageFilterSelectChanged}
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((s) => {
                        return (MESSAGE_STATUSES as any)[s].name;
                      })
                      .join(", ")
                  }
                >
                  {Object.keys(MESSAGE_STATUSES).map((messageStatus) => {
                    const displayText = (MESSAGE_STATUSES as any)[messageStatus]
                      .name;
                    const isChecked =
                      messageFilter &&
                      messageFilter.indexOf(messageStatus) > -1;
                    return (
                      <MenuItem key={displayText} value={messageStatus}>
                        <Checkbox checked={isChecked} />
                        <ListItemText primary={displayText} />
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText>Which Messages?</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <Autocomplete
                options={campaignNodes}
                getOptionLabel={(campaign) => campaign.text}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Campaign"
                    helperText="From which campaign?"
                  />
                )}
                onChange={onCampaignSelected}
              />
            </Grid>
            <Grid item xs={4}>
              {props.isTexterFilterable && (
                <Autocomplete
                  options={texterNodes}
                  getOptionLabel={(texter) => texter.text}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Texter"
                      helperText="From which texter?"
                    />
                  )}
                  onChange={onTexterSelected}
                />
              )}
            </Grid>
          </Grid>
          <TextField
            className={css(styles.fullWidth)}
            onChange={onContactNameChanged}
            fullWidth
            label="Filter contacts"
            helperText="Filter by Contact Name or Number"
          />
          <Grid container spacing={5}>
            <Grid item xs={4}>
              <FormControl className={css(styles.fullWidth)}>
                <InputLabel id="contact-tag-filter-label">
                  Filter by Contact Tags
                </InputLabel>
                <Select
                  multiple
                  value={props.tagsFilter ?? []}
                  onChange={props.onTagsChanged}
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((s) => props.tags.find((tag) => tag.id === s)?.title)
                      .join(", ")
                  }
                >
                  {props.tags.map(({ id, title }) => {
                    const isChecked =
                      props.tagsFilter && props.tagsFilter.includes(id);
                    return (
                      <MenuItem key={id} value={id}>
                        <Checkbox checked={isChecked} />
                        <ListItemText primary={title} />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default IncomingMessageFilter;
