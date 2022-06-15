import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Checkbox from "@material-ui/core/Checkbox";
import Collapse from "@material-ui/core/Collapse";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import Autocomplete, {
  AutocompleteChangeReason
} from "@material-ui/lab/Autocomplete";
import {
  useGetTagsQuery,
  useSearchCampaignsQuery,
  useSearchUsersQuery
} from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite";
import React, { useRef, useState } from "react";
import { useDebounce } from "use-debounce";

import { AssignmentsFilter } from "../../../api/assignment";
import { nameComponents } from "../../../lib/attributes";
import { ALL_TEXTERS, UNASSIGNED_TEXTER } from "../../../lib/constants";

type MessageStatus = {
  name: string;
  children: string[];
};

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%"
  }
});

export const MESSAGE_STATUSES: Record<string, MessageStatus> = {
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

export const CAMPAIGN_TYPE_FILTERS: Campaign[] = [
  { id: -1, title: "All Campaigns" }
];

export const TEXTER_FILTERS: Texter[] = [
  { id: UNASSIGNED_TEXTER, displayName: "Unassigned" },
  { id: ALL_TEXTERS, displayName: "All Texters" }
];

const IDLE_KEY_TIME = 500;

type Campaign = {
  id: number;
  title: string;
};

type Tag = {
  id: string;
  title: string;
};

type Texter = {
  id: number;
  displayName: string;
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
  assignmentsFilter: AssignmentsFilter;
  tagsFilter: Array<string>;
  organizationId: string;
  onCampaignChanged(campaignId: number): void;
  onTagsChanged(event: React.ChangeEvent<{ value: any }>): void;
  onTexterChanged(texterId: number): void;
  onIncludeEscalatedChanged(): void;
  onActiveCampaignsToggled(): void;
  onArchivedCampaignsToggled(): void;
  onNotOptedOutConversationsToggled(): void;
  onOptedOutConversationsToggled(): void;
  onMessageFilterChanged(messageStatuesString: string): void;
  searchByContactName(contactDetails: SearchByContactName): void;
}

const IncomingMessageFilter: React.FC<IncomingMessageFilterProps> = (props) => {
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>();
  const [cellNumber, setCellNumber] = useState<string>();
  const [messageFilter, setMessageFilter] = useState<Array<any>>(["all"]);
  const [showSection, setShowSection] = useState<boolean>(false);
  const [campaignSearchInput, setCampaignSearchInput] = useState<string>();
  const [campaignSearchInputDebounced] = useDebounce(campaignSearchInput, 500);
  const [texterSearchInput, setTexterSearchInput] = useState<string>();
  const [texterSearchInputDebounced] = useDebounce(texterSearchInput, 500);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const { data: getTags } = useGetTagsQuery({
    variables: { organizationId: props.organizationId }
  });

  const { data: getCampaigns } = useSearchCampaignsQuery({
    variables: {
      organizationId: props.organizationId,
      campaignsFilter:
        campaignSearchInputDebounced?.length > 0
          ? {
              campaignTitle: campaignSearchInputDebounced
            }
          : undefined
    }
  });

  const { data: getTexters } = useSearchUsersQuery({
    variables: {
      organizationId: props.organizationId,
      filter:
        texterSearchInputDebounced?.length > 0
          ? {
              nameSearch: texterSearchInputDebounced
            }
          : undefined
    }
  });

  const formatTags = (tags: Array<any>) => {
    return tags.map((tag) => {
      return {
        id: tag.id,
        title: tag.title
      };
    });
  };

  const formatCampaigns = (campaigns: Array<any>) => {
    return CAMPAIGN_TYPE_FILTERS.concat(
      campaigns.map((campaign) => {
        const title = `${campaign.id}: ${campaign.title}`;
        return { id: parseInt(campaign.id, 10), title };
      })
    );
  };

  const formatTexters = (texters: Array<any>) => {
    const formattedTexters: Texter[] = texters.map((texter) => {
      return {
        id: parseInt(texter.node.user.id, 10),
        displayName: texter.node.user.displayName
      };
    });

    return TEXTER_FILTERS.concat(formattedTexters);
  };

  const campaignOptions: Campaign[] = formatCampaigns(
    getCampaigns?.campaigns?.campaigns ?? []
  );
  const tagOptions: Tag[] = formatTags(getTags?.organization?.tagList ?? []);
  const texterOptions: Texter[] = formatTexters(
    getTexters?.organization?.memberships?.edges ?? []
  );

  const onMessageFilterSelectChanged = (
    event: React.ChangeEvent<{ value: unknown }>,
    _child: React.ReactNode
  ) => {
    const values = event.target.value as string[];
    setMessageFilter(values);
    const messageStatuses = new Set();
    values.forEach((value: string) => {
      const { children } = MESSAGE_STATUSES[value];
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
    value: Campaign | null,
    _reason: AutocompleteChangeReason
  ) => {
    let campaignId;
    if (value === null) {
      campaignId = -1;
    } else {
      campaignId = value.id;
    }
    props.onCampaignChanged(campaignId as number);
  };

  const onTexterSelected = (
    _event: React.ChangeEvent<any>,
    value: Texter | null,
    _reason: AutocompleteChangeReason
  ) => {
    let texterId;
    if (value === null) {
      texterId = -1;
    } else {
      texterId = value.id;
    }
    props.onTexterChanged(texterId as number);
  };

  const searchByNewContactName = () => {
    props.searchByContactName({ firstName, lastName, cellNumber });
    timeoutId.current = null;
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

    if (timeoutId.current) clearTimeout(timeoutId.current as NodeJS.Timeout);
    const submitNameUpdateTimeout = setTimeout(
      searchByNewContactName,
      IDLE_KEY_TIME
    );

    timeoutId.current = submitNameUpdateTimeout;
  };

  const handleExpandChange = () => {
    setShowSection(!showSection);
  };

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
                        return MESSAGE_STATUSES[s].name;
                      })
                      .join(", ")
                  }
                >
                  {Object.keys(MESSAGE_STATUSES).map((messageStatus) => {
                    const displayText = MESSAGE_STATUSES[messageStatus].name;
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
                options={campaignOptions}
                getOptionLabel={(campaign) => campaign.title}
                onInputChange={(_event, newValue) => {
                  setCampaignSearchInput(newValue);
                }}
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
                  options={texterOptions}
                  getOptionLabel={(texter) => texter.displayName}
                  onInputChange={(_event, newValue) => {
                    setTexterSearchInput(newValue);
                  }}
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
                      .map((s) => tagOptions.find((tag) => tag.id === s)?.title)
                      .join(", ")
                  }
                >
                  {tagOptions.map(({ id, title }) => {
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
