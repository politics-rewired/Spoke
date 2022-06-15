import { identity, pickBy } from "lodash";
import {
  decodeDelimitedArray,
  decodeObject,
  encodeDelimitedArray,
  encodeObject
} from "use-query-params";

import { AssignmentsFilter } from "../../api/assignment";
import { CampaignsFilter } from "../../api/campaign";
import { ContactNameFilter, ContactsFilter } from "../../api/campaign-contact";
import { TagsFilter } from "../../api/tag";

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
      if (["isOptedOut", "validTimeZone", "includePastDue"].includes(key)) {
        contactsFilter[key] = value === "true";
      } else {
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
      if (key === "isArchived") {
        filter[key] = value === "true";
      } else {
        filter[key] = parseInt(value, 10);
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
      if (key === "includeEscalated") {
        filter[key] = value === "true";
      } else {
        filter[key] = parseInt(value, 10);
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
      if (["excludeEscalated", "escalatedConvosOnly"].includes(key)) {
        filter[key] = value === "true";
      } else if (key === "specificTagIds") {
        filter[key] = decodeDelimitedArray(value, ",");
      }
    }

    return filter;
  }
};
