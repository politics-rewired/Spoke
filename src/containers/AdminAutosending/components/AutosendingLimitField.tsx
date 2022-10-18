import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import {
  useGetCampaignAutosendingLimitQuery,
  useUpdateCampaignAutosendingLimitMutation
} from "@spoke/spoke-codegen";
import React, { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export interface AutosendingLimitFieldProps {
  campaignId: string;
}

export const AutosendingLimitField: React.FC<AutosendingLimitFieldProps> = ({
  campaignId
}) => {
  const [inputValue, setInputValue] = useState<string | null>(null);

  const { data, loading } = useGetCampaignAutosendingLimitQuery({
    variables: { campaignId }
  });

  const [
    updateAutosendingLimit,
    { data: mutationData, loading: mutationLoading, error: mutationError }
  ] = useUpdateCampaignAutosendingLimitMutation();

  const debouncedUpdate = useDebouncedCallback((limit: number | null) => {
    updateAutosendingLimit({ variables: { campaignId, limit } });
  }, 300);

  const countMessagedContacts = useMemo(
    () => data?.campaign?.stats?.countMessagedContacts,
    [data]
  );

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const limitInt = parseInt(event.target.value, 10);
      const limit = Number.isNaN(limitInt)
        ? null
        : Math.max(limitInt, countMessagedContacts ?? 0);
      setInputValue(event.target.value ?? "");
      debouncedUpdate(limit);
    },
    [debouncedUpdate]
  );

  return (
    <TextField
      type="number"
      value={inputValue ?? data?.campaign?.autosendLimit ?? ""}
      disabled={loading}
      placeholder="n/a"
      style={{ width: "100px" }}
      InputProps={{
        endAdornment: mutationLoading ? (
          <InputAdornment position="end">
            <CircularProgress />
          </InputAdornment>
        ) : mutationError !== undefined ? (
          <InputAdornment position="end">
            <Tooltip title={mutationError.message} placement="top-end">
              <ErrorIcon />
            </Tooltip>
          </InputAdornment>
        ) : mutationData !== undefined ? (
          <InputAdornment position="end">
            <CheckCircleIcon />
          </InputAdornment>
        ) : undefined
      }}
      onChange={handleOnChange}
    />
  );
};

export default AutosendingLimitField;
