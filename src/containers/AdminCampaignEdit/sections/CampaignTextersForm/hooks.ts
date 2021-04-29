import { useEffect, useReducer, useRef, useState } from "react";

import { DateTime } from "../../../../lib/datetime";
import { OrgTexter, Texter } from "./types";

const getStagedTexters = (
  savedTexters: Texter[],
  upsertedTexters: Texter[],
  texterIdsToRemove: string[]
) => {
  const upsertedTexterIds = upsertedTexters.map(({ id }) => id);
  return savedTexters
    .filter((texter) => !upsertedTexterIds.includes(texter.id))
    .concat(upsertedTexters)
    .filter((texter) => !texterIdsToRemove.includes(texter.id));
};

enum StagedTexterActionType {
  SetAutoSplit = "SetAutoSplit",
  AddTexters = "AddTexters",
  RemoveTexter = "RemoveTexter",
  RemoveEmptyTexters = "RemoveEmptyTexters",
  AssignContacts = "AssignContacts",
  Reset = "Reset"
}

type StagedTexterAction =
  | { type: StagedTexterActionType.SetAutoSplit; autoSplit: boolean }
  | { type: StagedTexterActionType.AddTexters; texters: OrgTexter[] }
  | { type: StagedTexterActionType.RemoveTexter; texterId: string }
  | { type: StagedTexterActionType.RemoveEmptyTexters }
  | {
      type: StagedTexterActionType.AssignContacts;
      texterId: string;
      contactCount: number;
    }
  | {
      type: StagedTexterActionType.Reset;
      savedTexters: Texter[];
      campaignContactCount: number;
    };

interface StagedTexterState {
  savedTexters: Texter[];
  campaignContactCount: number;
  autoSplit: boolean;
  upsertedTexters: Texter[];
  texterIdsToRemove: string[];
  lastReset: DateTime;
}

type StagedTexterReducer = (
  state: StagedTexterState,
  action: StagedTexterAction
) => StagedTexterState;

const stagedTextersReducer: StagedTexterReducer = (state, action) => {
  const { savedTexters, campaignContactCount } = state;

  const evenlySplitContacts = (
    upsertedTexters: Texter[],
    texterIdsToRemove: string[]
  ) => {
    const stagedTexters = getStagedTexters(
      savedTexters,
      upsertedTexters,
      texterIdsToRemove
    );
    const messagedCount = savedTexters.reduce((acc: number, texter: Texter) => {
      const { contactsCount, needsMessageCount } = texter.assignment;
      return acc + (contactsCount - needsMessageCount);
    }, 0);
    const campaignNeedsMessageCount = campaignContactCount - messagedCount;

    const baseCount = Math.floor(
      campaignNeedsMessageCount / stagedTexters.length
    );
    const bonusCutoff = campaignNeedsMessageCount % stagedTexters.length;

    const textersEvenlySplit: Texter[] = stagedTexters.map((texter, index) => {
      const newNeedsMessageCount = baseCount + (index < bonusCutoff ? 1 : 0);
      const { contactsCount, needsMessageCount } = texter.assignment;
      const texterMessagedCount = contactsCount - needsMessageCount;
      return {
        ...texter,
        assignment: {
          ...texter.assignment,
          needsMessageCount: newNeedsMessageCount,
          contactsCount: newNeedsMessageCount + texterMessagedCount
        }
      };
    });

    return textersEvenlySplit;
  };

  switch (action.type) {
    case StagedTexterActionType.SetAutoSplit: {
      return {
        ...state,
        autoSplit: action.autoSplit,
        upsertedTexters: action.autoSplit
          ? evenlySplitContacts(state.upsertedTexters, state.texterIdsToRemove)
          : state.upsertedTexters
      };
    }
    case StagedTexterActionType.AddTexters: {
      const { texters: textersToAdd } = action;
      const texterIdsToAdd = new Set(textersToAdd.map(({ id }) => id));

      const newTexterIdsToRemove = state.texterIdsToRemove.filter(
        (id) => !texterIdsToAdd.has(id)
      );

      const newUpsertedTexters: Texter[] = state.upsertedTexters
        .filter(({ id }) => !texterIdsToAdd.has(id))
        .concat(
          textersToAdd.map((texterToAdd) => {
            const savedTexter = savedTexters.find(
              ({ id }) => id === texterToAdd.id
            );
            return (
              savedTexter ?? {
                ...texterToAdd,
                assignment: {
                  contactsCount: 0,
                  needsMessageCount: 0,
                  messagedCount: 0
                }
              }
            );
          })
        );
      return {
        ...state,
        upsertedTexters: state.autoSplit
          ? evenlySplitContacts(newUpsertedTexters, newTexterIdsToRemove)
          : newUpsertedTexters,
        texterIdsToRemove: newTexterIdsToRemove
      };
    }

    case StagedTexterActionType.RemoveTexter: {
      const { texterId } = action;
      const newUpsertedTexters = state.upsertedTexters.filter(
        ({ id }) => id !== texterId
      );
      const newTexterIdsToRemove = [
        ...new Set([...state.texterIdsToRemove, texterId])
      ];
      return {
        ...state,
        upsertedTexters: state.autoSplit
          ? evenlySplitContacts(newUpsertedTexters, newTexterIdsToRemove)
          : newUpsertedTexters,
        texterIdsToRemove: newTexterIdsToRemove
      };
    }

    case StagedTexterActionType.RemoveEmptyTexters: {
      const newUpsertedTexters = state.upsertedTexters.filter(
        (texter) =>
          texter.assignment.contactsCount !== 0 ||
          texter.assignment.needsMessageCount !== 0
      );
      return {
        ...state,
        upsertedTexters: state.autoSplit
          ? evenlySplitContacts(newUpsertedTexters, state.texterIdsToRemove)
          : newUpsertedTexters
      };
    }

    case StagedTexterActionType.AssignContacts: {
      if (state.autoSplit) return state;

      const { texterId, contactCount } = action;
      const stagedTexters = getStagedTexters(
        savedTexters,
        state.upsertedTexters,
        state.texterIdsToRemove
      );
      const editedTexter = stagedTexters.find(({ id }) => id === texterId);

      if (!editedTexter) return state;

      const savedTexter = savedTexters.find(({ id }) => id === texterId);
      const texterMessagedCount = savedTexter
        ? savedTexter.assignment.contactsCount -
          savedTexter.assignment.needsMessageCount
        : 0;
      const texterAssignedCount = editedTexter.assignment.contactsCount;

      const campaignAssignedCount = stagedTexters.reduce(
        (acc, texter) => acc + texter.assignment.contactsCount,
        0
      );
      const campaignUnassignedCount =
        campaignContactCount - campaignAssignedCount;

      const maxNewContacts = texterAssignedCount + campaignUnassignedCount;
      const minNewContacts = Math.max(0, texterMessagedCount);
      // contact's messaged count <= assigned contacts count <= total unmessaged count
      const newContactCount = Math.max(
        Math.min(maxNewContacts, contactCount),
        minNewContacts
      );

      editedTexter.assignment = {
        ...editedTexter.assignment,
        needsMessageCount: newContactCount - texterMessagedCount,
        contactsCount: newContactCount
      };

      const newUpsertedTexters = state.upsertedTexters
        .filter(({ id }) => id !== editedTexter.id)
        .concat([editedTexter]);

      return {
        ...state,
        upsertedTexters: newUpsertedTexters
      };
    }

    case StagedTexterActionType.Reset: {
      return {
        lastReset: DateTime.local(),
        savedTexters: action.savedTexters,
        campaignContactCount: action.campaignContactCount,
        autoSplit: false,
        upsertedTexters: [],
        texterIdsToRemove: []
      };
    }

    default:
      return state;
  }
};

export const useStagedTextersReducer = (
  campaignContactCount: number,
  savedTexters: Texter[]
) => {
  const [items, dispatch] = useReducer<StagedTexterReducer>(
    stagedTextersReducer,
    {
      savedTexters,
      campaignContactCount,
      autoSplit: false,
      upsertedTexters: [],
      texterIdsToRemove: [],
      lastReset: DateTime.local()
    }
  );

  const stagedTexters = getStagedTexters(
    savedTexters,
    items.upsertedTexters,
    items.texterIdsToRemove
  );

  const assignedContactsCount = stagedTexters.reduce<number>(
    (acc, texter) => acc + texter.assignment.contactsCount,
    0
  );

  const setAutoSplit = (autoSplit: boolean) => {
    dispatch({ type: StagedTexterActionType.SetAutoSplit, autoSplit });
  };

  const addTexters = (texters: OrgTexter[]) => {
    dispatch({ type: StagedTexterActionType.AddTexters, texters });
  };

  const removeTexter = (texterId: string) => {
    dispatch({ type: StagedTexterActionType.RemoveTexter, texterId });
  };

  const removeEmptyTexters = () => {
    dispatch({ type: StagedTexterActionType.RemoveEmptyTexters });
  };

  const assignContacts = (texterId: string, contactCount: number) => {
    dispatch({
      type: StagedTexterActionType.AssignContacts,
      texterId,
      contactCount
    });
  };

  const reset = (
    newSavedTexters: Texter[],
    newCampaignContactCount: number
  ) => {
    dispatch({
      type: StagedTexterActionType.Reset,
      savedTexters: newSavedTexters,
      campaignContactCount: newCampaignContactCount
    });
  };

  return {
    lastReset: items.lastReset,
    autoSplit: items.autoSplit,
    stagedTexters,
    assignedContactsCount,
    setAutoSplit,
    addTexters,
    removeTexter,
    removeEmptyTexters,
    assignContacts,
    reset
  };
};

export const useDebouncedValue = <T>(
  value: T,
  onChange: (val: T) => void,
  timeoutMs = 350
): [T, (val: T) => void] => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const [tempValue, setTempValue] = useState<T | undefined>(undefined);

  // Clear timeout on component unmount
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const debounceValue = (val: T) => {
    setTempValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(val);
      setTempValue(undefined);
    }, timeoutMs);
  };

  const currentValue = tempValue !== undefined ? tempValue : value;
  return [currentValue, debounceValue];
};
