import {
  AssignmentsFilter,
  CampaignsFilter,
  ContactNameFilter,
  ContactsFilter,
  TagsFilter
} from "@spoke/spoke-codegen";
import { identity, pickBy } from "lodash";
import {
  decodeDelimitedArray,
  decodeObject,
  encodeDelimitedArray,
  encodeObject
} from "use-query-params";

export const ContactsFilterParam = {
  encode: (filter: ContactsFilter | undefined): string | null | undefined => {
    return encodeObject(filter);
  },
  decode: (
    params: string | null | undefined
  ): ContactsFilter | null | undefined => {
    const decodedObject = decodeObject(params);

    if (!decodedObject) {
      return null;
    }

    const contactsFilter: ContactsFilter = {};

    for (const [key, value] of Object.entries(decodedObject)) {
      switch (key) {
        case "isOptedOut":
        case "validTimezone":
        case "includePastDue":
          contactsFilter[key] = value === "true";
          break;
        case "messageStatus":
          contactsFilter[key] = value;
          break;
        default:
          contactsFilter[key] = value;
      }
    }
    return contactsFilter;
  }
};

export const ContactNameParam = {
  encode: (
    filter: ContactNameFilter | undefined
  ): string | null | undefined => {
    return encodeObject(pickBy(filter, identity));
  },
  decode: (
    params: string | null | undefined
  ): ContactNameFilter | null | undefined => decodeObject(params)
};

export const CampaignsFilterParam = {
  encode: (filter: CampaignsFilter | undefined): string | null | undefined => {
    return encodeObject(filter);
  },
  decode: (
    params: string | null | undefined
  ): CampaignsFilter | null | undefined => {
    const decodedObject = decodeObject(params);

    if (!decodedObject) {
      return null;
    }

    const filter: CampaignsFilter = {};

    for (const [key, value] of Object.entries(decodedObject)) {
      switch (key) {
        case "isArchived":
        case "isStarted":
          filter[key] = value === "true";
          break;
        case "campaignId":
        case "listSize":
        case "organizationId":
        case "pageSize":
          filter[key] = parseInt(value, 10);
          break;
        case "campaignTitle":
          filter[key] = value;
          break;
        default:
          filter[key] = value;
      }
    }

    return filter;
  }
};

export const AssignmentsFilterParam = {
  encode: (
    filter: AssignmentsFilter | undefined
  ): string | null | undefined => {
    return encodeObject(filter);
  },
  decode: (
    params: string | null | undefined
  ): AssignmentsFilter | null | undefined => {
    const decodedObject = decodeObject(params);

    if (!decodedObject) {
      return null;
    }

    const filter: AssignmentsFilter = {};

    for (const [key, value] of Object.entries(decodedObject)) {
      switch (key) {
        case "includeEscalated":
          filter[key] = value === "true";
          break;
        case "texterId":
          filter[key] = parseInt(value, 10);
          break;
        default:
          filter[key] = value;
      }
    }

    return filter;
  }
};

export const TagsFilterParam = {
  encode: (filter: TagsFilter | undefined): string | null | undefined => {
    if (filter?.specificTagIds) {
      filter.specificTagIds = encodeDelimitedArray(filter?.specificTagIds, ",");
    }
    return encodeObject(filter);
  },
  decode: (
    params: string | null | undefined
  ): TagsFilter | null | undefined => {
    const decodedObject = decodeObject(params);

    if (!decodedObject) {
      return null;
    }

    const filter: TagsFilter = {};

    for (const [key, value] of Object.entries(decodedObject)) {
      switch (key) {
        case "excludeEscalated":
        case "escalatedConvosOnly":
          filter[key] = value === "true";
          break;
        case "specificTagIds":
          filter[key] = decodeDelimitedArray(value, ",");
          break;
        default:
          filter[key] = value;
      }
    }

    return filter;
  }
};
