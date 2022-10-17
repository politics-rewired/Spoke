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
import type { AutocompleteChangeReason } from "@material-ui/lab/Autocomplete";
import Autocomplete from "@material-ui/lab/Autocomplete";
import type { ContactNameFilter } from "@spoke/spoke-codegen";
import {
  useGetTagsQuery,
  useSearchCampaignsQuery,
  useSearchUsersQuery
} from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite";
import React, { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

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
  { id: "-1", title: "All Campaigns" }
];

export const TEXTER_FILTERS: Texter[] = [
  { id: UNASSIGNED_TEXTER.toString(), displayName: "Unassigned" },
  { id: ALL_TEXTERS.toString(), displayName: "All Texters" }
];

const DEBOUNCE_TIME = 500;

type Campaign = {
  id: string;
  title: string;
};

type Tag = {
  id: string;
  title: string;
};

type Texter = {
  id: string;
  displayName: string;
};

interface IncomingMessageFilterProps {
  isTexterFilterable: boolean;
  isIncludeEscalatedFilterable: boolean;
  includeEscalated: boolean;
  includeNotOptedOutConversations: boolean;
  includeOptedOutConversations: boolean;
  includeArchivedCampaigns: boolean;
  includeActiveCampaigns: boolean;
  tagsFilter: Array<string>;
  organizationId: string;
  campaignId: number | null;
  texterId: number | null;
  messageStatusFilter: string | null;
  contactNameFilter: ContactNameFilter | null | undefined;
  onCampaignChanged(campaignId: number): void;
  onTagsChanged(event: React.ChangeEvent<{ value: any }>): void;
  onTexterChanged(texterId: number): void;
  onIncludeEscalatedChanged(): void;
  onActiveCampaignsToggled(): void;
  onArchivedCampaignsToggled(): void;
  onNotOptedOutConversationsToggled(): void;
  onOptedOutConversationsToggled(): void;
  onMessageFilterChanged(messageStatuesString: string): void;
  searchByContactName(contactDetails: ContactNameFilter): void;
}

const IncomingMessageFilter: React.FC<IncomingMessageFilterProps> = (props) => {
  const [firstName, setFirstName] = useState<string | undefined>(
    props.contactNameFilter?.firstName ?? undefined
  );
  const [lastName, setLastName] = useState<string | undefined>(
    props.contactNameFilter?.lastName ?? undefined
  );
  const [cellNumber, setCellNumber] = useState<string | undefined>(
    props.contactNameFilter?.cellNumber ?? undefined
  );
  const [showSection, setShowSection] = useState<boolean>(true);
  const [campaignId, setCampaignId] = useState<string | undefined | null>("");
  const [texterId, setTexterId] = useState<string | undefined | null>("");

  const [campaignSearchInput, setCampaignSearchInput] = useState<string>("");
  const [campaignSearchInputDebounced] = useDebounce(
    campaignSearchInput,
    DEBOUNCE_TIME
  );
  const [texterSearchInput, setTexterSearchInput] = useState<string>("");
  const [texterSearchInputDebounced] = useDebounce(
    texterSearchInput,
    DEBOUNCE_TIME
  );

  const [firstNameDebounced] = useDebounce(firstName, DEBOUNCE_TIME);
  const [lastNameDebounced] = useDebounce(lastName, DEBOUNCE_TIME);
  const [cellNumberDebounced] = useDebounce(cellNumber, DEBOUNCE_TIME);

  const defaultMessageFilter = props.messageStatusFilter
    ? props.messageStatusFilter.split(",")
    : [];

  const [messageFilter, setMessageFilter] = useState<Array<any>>(
    defaultMessageFilter
  );

  useEffect(() => {
    props.searchByContactName({
      firstName: firstNameDebounced,
      lastName: lastNameDebounced,
      cellNumber: cellNumberDebounced
    });
  }, [firstNameDebounced, lastNameDebounced, cellNumberDebounced]);

  const { data: getTags } = useGetTagsQuery({
    variables: { organizationId: props.organizationId }
  });

  const {
    data: getCampaigns,
    previousData: getCampaignsPreviousData
  } = useSearchCampaignsQuery({
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

  useEffect(() => {
    if (getCampaigns && !getCampaignsPreviousData) {
      setCampaignId(props?.campaignId?.toString() ?? null);
    }
  }, [getCampaigns, getCampaignsPreviousData]);

  const {
    data: getTexters,
    previousData: getTextersPreviousData
  } = useSearchUsersQuery({
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

  useEffect(() => {
    if (getTexters && !getTextersPreviousData) {
      setTexterId(props?.texterId?.toString() ?? null);
    }
  }, [getTexters, getTextersPreviousData]);

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
        return { id: campaign.id, title };
      })
    );
  };

  const formatTexters = (texters: Array<any>) => {
    const formattedTexters: Texter[] = texters.map((texter) => {
      return {
        id: texter.node.user.id,
        displayName: texter.node.user.displayName
      };
    });

    return TEXTER_FILTERS.concat(formattedTexters);
  };

  const formattedCampaigns = formatCampaigns(
    getCampaigns?.campaigns?.campaigns ?? []
  );
  const formattedTexters = formatTexters(
    getTexters?.organization?.memberships?.edges ?? []
  );

  const campaignsMap = useMemo(
    () => new Map(formattedCampaigns.map((c) => [c.id, c.title])),
    [formattedCampaigns]
  );

  const textersMap = useMemo(
    () => new Map(formattedTexters.map((t) => [t.id, t.displayName])),
    [formattedTexters]
  );

  const campaignOptions: string[] = formattedCampaigns.map((op) => op.id);
  const tagOptions: Tag[] = formatTags(getTags?.organization?.tagList ?? []);
  const texterOptions: string[] = formattedTexters.map((op) => op.id);

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
    value: string | null,
    _reason: AutocompleteChangeReason
  ) => {
    let newCampaignId;
    if (value === null) {
      newCampaignId = -1;
    } else {
      newCampaignId = value;
    }
    setCampaignId(value);
    props.onCampaignChanged(newCampaignId as number);
  };

  const onTexterSelected = (
    _event: React.ChangeEvent<any>,
    value: string | null,
    _reason: AutocompleteChangeReason
  ) => {
    let newTexterId;
    if (value === null) {
      newTexterId = -1;
    } else {
      newTexterId = value;
    }
    setTexterId(value);
    props.onTexterChanged(newTexterId as number);
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

  const contactFilterDefault = useMemo(() => {
    let contactName = firstName ?? "";
    if (lastName) {
      contactName = contactName.concat(" ", lastName);
    }
    if (cellNumber) {
      contactName = contactName.concat(" ", cellNumber);
    }

    return contactName;
  }, [firstName, lastName, cellNumber]);

  return (
    <Card>
      <CardHeader
        title="Message Filter"
        action={
          <IconButton>
            {showSection ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
        style={{ cursor: "pointer" }}
        onClick={handleExpandChange}
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
                value={campaignId}
                options={campaignOptions}
                inputValue={campaignSearchInput}
                getOptionLabel={(option) => campaignsMap.get(option) ?? ""}
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
                  value={texterId}
                  options={texterOptions}
                  inputValue={texterSearchInput}
                  getOptionLabel={(option) => textersMap.get(option) ?? ""}
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
            defaultValue={contactFilterDefault}
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
