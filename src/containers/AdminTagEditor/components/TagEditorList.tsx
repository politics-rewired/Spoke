import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import { red } from "@material-ui/core/colors";
import Paper from "@material-ui/core/Paper";
import BlockIcon from "@material-ui/icons/Block";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CreateIcon from "@material-ui/icons/Create";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import type { Tag } from "@spoke/spoke-codegen";
import React from "react";

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-start"
  },
  card: {
    margin: 10,
    padding: 10
  },
  chip: {
    marginRight: "auto",
    color: "#000000"
  },
  description: {
    maxWidth: "200px"
  }
};

export interface TagEditorListProps {
  tags: Tag[];
  onEditTag: (id: string) => Promise<void> | void;
  onDeleteTag: (id: string) => Promise<void> | void;
}

const TagEditorList: React.FC<TagEditorListProps> = ({
  tags,
  onEditTag,
  onDeleteTag
}: TagEditorListProps) => {
  const createHandleEditTag = (tagId: string) => () => onEditTag(tagId);
  const createHandleDeleteTag = (tagId: string) => () => onDeleteTag(tagId);

  return (
    <div style={styles.wrapper}>
      {tags.map((tag) => (
        <Paper key={tag.id} style={styles.card}>
          <div style={{ display: "flex" }}>
            <Chip
              label={tag.title}
              style={{
                ...styles.chip,
                color: tag.textColor,
                backgroundColor: tag.backgroundColor
              }}
            />
          </div>
          {tag.description && (
            <p style={styles.description}>{tag.description}</p>
          )}
          <p>
            Assignable? {tag.isAssignable ? <CheckCircleIcon /> : <BlockIcon />}
          </p>
          <div style={{ display: "flex" }}>
            <Button
              variant="contained"
              color="primary"
              disabled={tag.isSystem}
              endIcon={<CreateIcon />}
              style={{ marginRight: 10 }}
              onClick={createHandleEditTag(tag.id)}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              disabled={tag.isSystem}
              endIcon={
                <DeleteForeverIcon
                  style={{ color: !tag.isSystem ? red[500] : undefined }}
                />
              }
              onClick={createHandleDeleteTag(tag.id)}
            >
              Delete
            </Button>
          </div>
          {tag.isSystem && <p>System tags cannot be edited</p>}
        </Paper>
      ))}
    </div>
  );
};

export default TagEditorList;
