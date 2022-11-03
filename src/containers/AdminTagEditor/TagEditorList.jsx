import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import { red } from "@material-ui/core/colors";
import Paper from "@material-ui/core/Paper";
import BlockIcon from "@material-ui/icons/Block";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CreateIcon from "@material-ui/icons/Create";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import PropTypes from "prop-types";
import React, { Component } from "react";

const styles = {
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

class TagEditorList extends Component {
  createHandleEditTag = (tagId) => () => this.props.oEditTag(tagId);

  createHandleDeleteTag = (tagId) => () => this.props.onDeleteTag(tagId);

  render() {
    const { tags } = this.props;

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
              Assignable?{" "}
              {tag.isAssignable ? <CheckCircleIcon /> : <BlockIcon />}
            </p>
            <div style={{ display: "flex" }}>
              <Button
                variant="contained"
                color="primary"
                disabled={tag.isSystem}
                endIcon={<CreateIcon />}
                style={{ marginRight: 10 }}
                onClick={this.createHandleEditTag(tag.id)}
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
                onClick={this.createHandleDeleteTag(tag.id)}
              >
                Delete
              </Button>
            </div>
            {tag.isSystem && <p>System tags cannot be edited</p>}
          </Paper>
        ))}
      </div>
    );
  }
}

TagEditorList.defaultProps = {};

TagEditorList.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object).isRequired,
  oEditTag: PropTypes.func.isRequired,
  onDeleteTag: PropTypes.func.isRequired
};

export default TagEditorList;
