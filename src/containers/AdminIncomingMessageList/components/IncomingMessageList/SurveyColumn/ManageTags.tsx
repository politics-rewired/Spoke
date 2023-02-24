import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import type { CampaignContactTag } from "@spoke/spoke-codegen";
import {
  useGetContactTagsQuery,
  useGetOrganizationTagsQuery,
  useTagConversationMutation
} from "@spoke/spoke-codegen";
import isEqual from "lodash/isEqual";
import React, { useEffect, useMemo, useRef, useState } from "react";

import TagSelector from "../../../../../components/TagSelector";

const useGetTagsData = (organizationId: string, contactId: string) => {
  const {
    data: orgTagsData,
    loading: orgTagsLoading,
    error: orgTagsError
  } = useGetOrganizationTagsQuery({
    variables: { organizationId },
    fetchPolicy: "network-only"
  });

  const organizationTags = orgTagsData?.organization?.tagList ?? undefined;

  const {
    data: contactTagsData,
    loading: contactTagsLoading,
    error: contactTagsError
  } = useGetContactTagsQuery({
    variables: { contactId },
    fetchPolicy: "network-only"
  });

  const contactTags = contactTagsData?.contact?.tags;

  const error = orgTagsError ?? contactTagsError;
  const loading = orgTagsLoading || contactTagsLoading;
  const data =
    organizationTags && contactTags
      ? {
          organizationTags,
          contactTags
        }
      : undefined;

  return { data, loading, error };
};

const usePrevious = <T,>(value: T) => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

interface ManageTagsProps {
  organizationId: string;
  contactId: string;
}

const ManageTags: React.FC<ManageTagsProps> = (props) => {
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<
    Omit<CampaignContactTag, "updatedAt" | "tagger" | "createdAt">[]
  >([]);
  const [tagContact, { loading: isWorking }] = useTagConversationMutation({
    // refetchQueries: ["getContactTags"]
  });
  const [error, setError] = useState<string | undefined>(undefined);

  const { data, loading, error: tagsError } = useGetTagsData(
    props.organizationId,
    props.contactId
  );

  const organizationTags = useMemo(() => data?.organizationTags ?? [], [
    data?.organizationTags
  ]);
  const savedTags = useMemo(() => data?.contactTags ?? [], [data?.contactTags]);
  const previousSavedTags = usePrevious(savedTags);

  useEffect(() => {
    if (!isEqual(savedTags, previousSavedTags)) {
      setSelectedTags([...savedTags]);
    }
  }, [savedTags, previousSavedTags, setSelectedTags]);

  if (loading || !data) {
    return <div />;
  }

  const handleOnClickEditTags = () => {
    setSelectedTags(savedTags);
    setIsTagEditorOpen(true);
  };

  const handleCloseTagManager = () => setIsTagEditorOpen(false);

  const handleOnChangeTags = (tags: CampaignContactTag[]) =>
    setSelectedTags(tags);

  const handleSaveTags = async () => {
    const contactTagIds = new Set(savedTags.map((tag) => tag.tag.id));
    const selectedTagIds = new Set(selectedTags.map((tag) => tag.tag.id));
    const addedTags = selectedTags.filter(
      (tag) => !contactTagIds.has(tag.tag.id)
    );
    const removedTags = savedTags.filter(
      (tag) => !selectedTagIds.has(tag.tag.id)
    );
    const tagPayload = {
      addedTagIds: addedTags.map((tag) => tag.tag.id),
      removedTagIds: removedTags.map((tag) => tag.tag.id)
    };

    try {
      const response = await tagContact({
        variables: { contactId: props.contactId, tagPayload }
      });
      if (response.errors) throw response.errors;
      handleCloseTagManager();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseErrorDialog = () => setError(undefined);

  const tagList = organizationTags;
  const tags = savedTags;

  const actions = [
    <Button
      key="save"
      variant="contained"
      color="primary"
      disabled={isWorking}
      onClick={handleSaveTags}
    >
      Save
    </Button>,
    <Button key="cancel" onClick={handleCloseTagManager}>
      Cancel
    </Button>
  ];

  const errorActions = [
    <Button
      key="ok"
      variant="contained"
      color="primary"
      disabled={isWorking}
      onClick={handleCloseErrorDialog}
    >
      OK
    </Button>
  ];

  return (
    <div style={{ textAlign: "right" }}>
      <Button
        variant="contained"
        disabled={isWorking}
        onClick={handleOnClickEditTags}
      >{`Edit Tags (${tags.length})`}</Button>
      <Dialog open={isTagEditorOpen} onClose={handleCloseTagManager}>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          <TagSelector
            dataSource={tagList}
            value={selectedTags}
            onChange={handleOnChangeTags}
          />
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
      <Dialog open={error !== undefined} onClose={handleCloseErrorDialog}>
        <DialogTitle>Error Updating Tags</DialogTitle>
        <DialogContent>
          <DialogContentText>{error}</DialogContentText>
        </DialogContent>
        <DialogActions>{errorActions}</DialogActions>
      </Dialog>
    </div>
  );
};

export default ManageTags;
