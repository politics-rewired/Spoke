import PropTypes from "prop-types";
import React from "react";
import yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import sortBy from "lodash/sortBy";

import Select from "react-select";
import FileDrop from "react-file-drop";
import RaisedButton from "material-ui/RaisedButton";
import Subheader from "material-ui/Subheader";
import Toggle from "material-ui/Toggle";
import { ListItem, List } from "material-ui/List";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import UploadIcon from "material-ui/svg-icons/file/file-upload";

import { dataTest } from "../../../../lib/attributes";
import theme from "../../../../styles/theme";
import GSForm from "../../../../components/forms/GSForm";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";

import "./styles/file-drop.css";

const checkIcon = <CheckIcon color={theme.colors.green} />;
const errorIcon = <ErrorIcon color={theme.colors.red} />;

const innerStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  nestedItem: {
    fontSize: "12px"
  }
};

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
    padding: 3
  },
  exampleImageInput: {
    cursor: "pointer",
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: "100%",
    opacity: 0
  }
});

export default class CampaignContactsForm extends React.Component {
  state = {
    contactUploadError: null,
    selectedCampaignIds: []
  };

  handleCampaignExclusionChange = (selectedOptions, { action, option }) => {
    const selectedCampaignIds = selectedOptions.map(option => option.value);
    this.setState({ selectedCampaignIds });
  };

  validateSql = sql => {
    const errors = [];
    if (!sql.startsWith("SELECT")) {
      errors.push('Must start with "SELECT" in caps');
    }
    if (
      /LIMIT (\d+)/i.test(sql) &&
      parseInt(sql.match(/LIMIT (\d+)/i)[1], 10) > 10000
    ) {
      errors.push(
        "Spoke currently does not support LIMIT statements of higher than 10000"
      );
    }
    const requiredFields = ["first_name", "last_name", "cell"];
    requiredFields.forEach(f => {
      if (sql.indexOf(f) === -1) {
        errors.push('"' + f + '" is a required column');
      }
    });
    if (sql.indexOf(";") >= 0) {
      errors.push('Do not include a trailing (or any) ";"');
    }
    if (!errors.length) {
      this.setState({
        contactSqlError: null
      });
      this.props.onChange({
        contactSql: sql
      });
    } else {
      this.setState({ contactSqlError: errors.join(", ") });
      this.props.onChange({});
    }
  };

  handleFileDrop = (files, event) =>
    this.props.onChange({ contactsFile: files[0] });

  handleOnSelectFile = ({ target }) => {
    const files = target.files;
    this.props.onChange({ contactsFile: files[0] });
  };

  onFilterOutLandlinesToggle = (_ev, toggled) => {
    this.setState({ filterOutLandlines: toggled });
    this.props.onChange({ filterOutLandlines: toggled });
  };

  renderCampaignExclusion() {
    const sortedCampaigns = sortBy(
      this.props.otherCampaigns,
      ["createdAt"],
      ["desc"]
    );
    const options = sortedCampaigns.map(campaign => ({
      label: campaign.title,
      value: campaign.id
    }));

    return (
      <div>
        <p>
          You can also filter out contacts from this upload that are already
          uploaded to an existing Spoke campaigns (regardless of whether they
          have been texted yet in that campaign).
        </p>
        <Select
          name="Campaigns"
          placeholder="Select existing campaigns"
          isMulti
          options={options}
          defaultValue={[]}
          onChange={this.handleCampaignExclusionChange}
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </div>
    );
  }

  renderContactStats() {
    const { customFields, contactsCount } = this.props.formValues;

    if (contactsCount === 0) {
      return "";
    }
    return (
      <List>
        <Subheader>Uploaded</Subheader>
        <ListItem
          {...dataTest("uploadedContacts")}
          primaryText={`${contactsCount} contacts`}
          leftIcon={checkIcon}
        />
        <ListItem
          primaryText={`${customFields.length} custom fields`}
          leftIcon={checkIcon}
          nestedItems={customFields.map((field, index) => (
            <ListItem
              key={index}
              innerDivStyle={innerStyles.nestedItem}
              primaryText={field}
            />
          ))}
        />
      </List>
    );
  }

  renderUploadButton() {
    const { contactsFile } = this.props.formValues;
    return (
      <FileDrop
        onDrop={this.handleFileDrop}
        targetClassName={
          contactsFile ? "file-drop-target with-file" : "file-drop-target"
        }
      >
        <p>{contactsFile ? contactsFile.name : "Drop a csv here, or"}</p>
        <RaisedButton
          label="Select a file"
          containerElement="label"
          icon={<UploadIcon />}
        >
          <input
            id="csv-upload-field"
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={this.handleOnSelectFile}
          />
        </RaisedButton>
      </FileDrop>
    );
  }

  renderForm() {
    const { canFilterLandlines, jobResult } = this.props;
    const { contactUploadError, contactSqlError } = this.state;
    return (
      <div>
        {this.renderCampaignExclusion()}
        <GSForm
          schema={yup.object({
            contactSql: yup.string()
          })}
          onSubmit={formValues => {
            // sets values locally
            this.setState({ ...formValues });
            // triggers the parent to update values
            this.props.onChange({ ...formValues });
            // and now do whatever happens when clicking 'Next'
            this.props.onSubmit();
          }}
        >
          {canFilterLandlines && (
            <div>
              <p>
                Filter out landlines?
                <Toggle
                  value={this.state.filterOutLandlines}
                  onToggle={this.onFilterOutLandlinesToggle}
                />
              </p>
            </div>
          )}
          {this.renderUploadButton()}
          {!this.props.datawarehouseAvailable ? (
            ""
          ) : (
            <div>
              <div>
                Instead of uploading contacts, as a super-admin, you can also
                create a SQL query directly from the data warehouse that will
                load in contacts. The SQL requires some constraints:
                <ul>
                  <li>Start the query with "SELECT"</li>
                  <li>Do not include a trailing (or any) semicolon</li>
                  <li>
                    Three columns are necessary:
                    <span className={css(styles.csvHeader)}>first_name</span>,
                    <span className={css(styles.csvHeader)}>last_name</span>,
                    <span className={css(styles.csvHeader)}>cell</span>,
                  </li>
                  <li>
                    Optional fields are:
                    <span className={css(styles.csvHeader)}>zip</span>,
                    <span className={css(styles.csvHeader)}>external_id</span>
                  </li>
                  <li>
                    Make sure you make those names exactly possibly requiring an
                    <span className={css(styles.csvHeader)}>
                      as field_name
                    </span>{" "}
                    sometimes.
                  </li>
                  <li>Other columns will be added to the customFields</li>
                </ul>
              </div>
              <Form.Field
                name="contactSql"
                type="textarea"
                rows="5"
                onChange={this.validateSql}
              />
              {contactSqlError ? (
                <List>
                  <ListItem
                    primaryText={contactSqlError}
                    leftIcon={errorIcon}
                  />
                </List>
              ) : (
                ""
              )}
            </div>
          )}
          {jobResult && (
            <List>
              <Subheader>Upload Messages</Subheader>
              {jobResult.resultMessage.split("\n").length > 0 ? (
                jobResult.resultMessage
                  .split("\n")
                  .map(message => (
                    <ListItem key={message} primaryText={message} />
                  ))
              ) : (
                <ListItem primaryText={"No results"} />
              )}
            </List>
          )}
          {this.renderContactStats()}
          {contactUploadError ? (
            <List>
              <ListItem primaryText={contactUploadError} leftIcon={errorIcon} />
            </List>
          ) : (
            ""
          )}
          <Form.Button
            type="submit"
            component={RaisedButton}
            disabled={this.props.saveDisabled}
            label={this.props.saveLabel}
          />
        </GSForm>
      </div>
    );
  }

  render() {
    let subtitle = (
      <span>
        Your upload file should be in CSV format with column headings in the
        first row. You must include{" "}
        <span className={css(styles.csvHeader)}>firstName</span>,
        <span className={css(styles.csvHeader)}>lastName</span>, and
        <span className={css(styles.csvHeader)}>cell</span> columns. If you
        include a <span className={css(styles.csvHeader)}>zip</span> column,
        we'll use the zip to guess the contact's timezone for enforcing texting
        hours. An optional column to map the contact to a CRM is{" "}
        <span className={css(styles.csvHeader)}>external_id</span>
        Any additional columns in your file will be available as custom fields
        to use in your texting scripts.
      </span>
    );

    return (
      <div>
        <CampaignFormSectionHeading
          title="Who are you contacting?"
          subtitle={subtitle}
        />
        {this.renderForm()}
      </div>
    );
  }
}

CampaignContactsForm.propTypes = {
  datawarehouseAvailable: PropTypes.bool,
  onChange: PropTypes.func,
  optOuts: PropTypes.array,
  formValues: PropTypes.object,
  ensureComplete: PropTypes.bool,
  onSubmit: PropTypes.func,
  saveDisabled: PropTypes.bool,
  saveLabel: PropTypes.string,
  jobResult: PropTypes.object,
  otherCampaigns: PropTypes.array,
  canFilterLandlines: PropTypes.bool
};
