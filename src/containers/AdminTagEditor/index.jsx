import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import { connect } from "react-apollo";
import pick from "lodash/pick";

import FloatingActionButton from "material-ui/FloatingActionButton";
import Dialog from "material-ui/Dialog";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import FlatButton from "material-ui/FlatButton";
import ContentAddIcon from "material-ui/svg-icons/content/add";

import LoadingIndicator from "../../components/LoadingIndicator";
import TagEditorList from "./TagEditorList";
import theme from "../../styles/theme";

class AdminTagEditor extends Component {
  state = {
    editingTag: undefined,
    isWorking: false
  };

  getTag = tagId => {
    const { tags = [] } = this.props.organizationTags.organization || {};
    return Object.assign({}, tags.find(tag => tag.id === tagId));
  };

  handleClickAddTag = () =>
    this.setState({ editingTag: { isAssignable: true } });

  handleEditTag = tagId => this.setState({ editingTag: this.getTag(tagId) });

  handleCancelEditTag = () => this.setState({ editingTag: undefined });

  handleSaveTag = async () => {
    const { editingTag } = this.state;
    const tag = pick(editingTag, [
      "id",
      "title",
      "description",
      "isAssignable"
    ]);
    this.setState({ isWorking: true });
    try {
      const result = await this.props.mutations.saveTag(tag);
      if (result.errors) throw new Error(result.errors);
      this.props.organizationTags.refetch();
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ isWorking: false });
      this.handleCancelEditTag();
    }
  };

  handleDeleteTag = async tagId => {
    this.setState({ isWorking: true });
    try {
      const result = await this.props.mutations.deleteTag(tagId);
      if (result.errors) throw new Error(result.errors);
      this.props.organizationTags.refetch();
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  createTagEditorHandle = (event, value) => {
    let { editingTag } = this.state;
    editingTag = Object.assign(editingTag, { [event.target.name]: value });
    this.setState({ editingTag });
  };

  render() {
    const { organizationTags } = this.props;
    const { editingTag, isWorking } = this.state;

    if (organizationTags.loading) return <LoadingIndicator />;
    if (organizationTags.errors) return <p>{organizationTags.errors}</p>;

    const { tags } = organizationTags.organization;

    const isNewTag = (editingTag || {}).id === undefined;
    const tagVerb = isNewTag ? "Create" : "Edit";
    const actions = [
      <FlatButton label="Cancel" onClick={this.handleCancelEditTag} />,
      <FlatButton label={tagVerb} primary={true} onClick={this.handleSaveTag} />
    ];

    return (
      <div>
        <TagEditorList
          tags={tags}
          oEditTag={this.handleEditTag}
          onDeleteTag={this.handleDeleteTag}
        />
        <FloatingActionButton
          style={theme.components.floatingButton}
          disabled={isWorking}
          onClick={this.handleClickAddTag}
        >
          <ContentAddIcon />
        </FloatingActionButton>
        {editingTag && (
          <Dialog
            title={`${tagVerb} Tag`}
            actions={actions}
            modal={false}
            open={true}
            onRequestClose={this.handleCancelEditTag}
          >
            <TextField
              name="title"
              floatingLabelText="Tag title"
              value={editingTag.title || ""}
              onChange={this.createTagEditorHandle}
            />
            <br />
            <TextField
              name="description"
              floatingLabelText="Tag description"
              multiLine={true}
              value={editingTag.description || ""}
              onChange={this.createTagEditorHandle}
            />
            <br />
            <br />
            <Toggle
              name="isAssignable"
              label="Allow assignment?"
              toggled={editingTag.isAssignable}
              onToggle={this.createTagEditorHandle}
            />
          </Dialog>
        )}
      </div>
    );
  }
}

AdminTagEditor.defaultProps = {};

AdminTagEditor.propTypes = {
  params: PropTypes.object.isRequired
};

const mapQueriesToProps = ({ ownProps }) => ({
  organizationTags: {
    query: gql`
      query getOrganizationTags($organizationId: String!) {
        organization(id: $organizationId) {
          id
          tags {
            id
            title
            description
            isSystem
            isAssignable
            createdAt
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  }
});

const mapMutationsToProps = ({ ownProps }) => ({
  saveTag: tag => ({
    mutation: gql`
      mutation saveTag($organizationId: String!, $tag: TagInput!) {
        saveTag(organizationId: $organizationId, tag: $tag) {
          id
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      tag
    }
  }),
  deleteTag: tagId => ({
    mutation: gql`
      mutation deleteTag($organizationId: String!, $tagId: String!) {
        deleteTag(organizationId: $organizationId, tagId: $tagId)
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      tagId
    }
  })
});

export default connect({
  mapQueriesToProps,
  mapMutationsToProps
})(AdminTagEditor);
