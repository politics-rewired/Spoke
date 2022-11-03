/* eslint-disable jsx-a11y/label-has-associated-control */
import "../styles/file-drop.css";

import Button from "@material-ui/core/Button";
import PublishIcon from "@material-ui/icons/Publish";
import { css, StyleSheet } from "aphrodite";
import React from "react";
import { FileDrop } from "react-file-drop";

import theme from "../../../../../styles/theme";

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
    padding: 3
  }
});

const SectionSubtitle: React.SFC = () => (
  <span>
    Your upload file should be in CSV format with column headings in the first
    row. You must include{" "}
    <span className={css(styles.csvHeader)}>firstName</span>,{" "}
    <span className={css(styles.csvHeader)}>lastName</span>, and{" "}
    <span className={css(styles.csvHeader)}>cell</span> columns. If you include
    a <span className={css(styles.csvHeader)}>zip</span> column, we'll use the
    zip to guess the contact's timezone for enforcing texting hours. An optional
    column to map the contact to a CRM is{" "}
    <span className={css(styles.csvHeader)}>external_id</span>. Any additional
    columns in your file will be available as custom fields to use in your
    texting scripts.
  </span>
);

interface Props {
  contactsFile: File | null;
  onContactsFileChange(file?: File): void;
}

const CSVForm: React.SFC<Props> = (props) => {
  const { contactsFile } = props;

  const handleFileDrop = (files: FileList | null) => {
    const file = (files || [])[0];
    props.onContactsFileChange(file);
  };

  const handleOnSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files || [];
    props.onContactsFileChange(files[0]);
  };

  return (
    <div>
      <SectionSubtitle />
      <br />
      <br />
      <FileDrop
        onDrop={handleFileDrop}
        targetClassName={
          contactsFile ? "file-drop-target with-file" : "file-drop-target"
        }
      >
        <p>{contactsFile ? contactsFile.name : "Drop a csv here, or"}</p>
        <input
          id="csv-upload-field"
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleOnSelectFile}
        />
        <label htmlFor="csv-upload-field">
          <Button
            variant="contained"
            endIcon={<PublishIcon />}
            component="span"
          >
            Select a file
          </Button>
        </label>
      </FileDrop>
    </div>
  );
};

export default CSVForm;
