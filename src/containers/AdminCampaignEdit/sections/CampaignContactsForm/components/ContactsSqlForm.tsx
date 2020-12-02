import { css, StyleSheet } from "aphrodite";
import TextField from "material-ui/TextField";
import React from "react";

import theme from "../../../../../styles/theme";

interface ContactsSqlProps {
  onChangeValidSql(sql: string | null): void;
}

interface ContactsSqlState {
  pendingSql: string;
  sqlError?: string;
}

const validateSql = (sql: string) => {
  const errors = [];
  if (!sql.startsWith("SELECT")) {
    errors.push('Must start with "SELECT" in caps');
  }

  const [_wholeMatch, limit] = sql.match(/LIMIT (\d+)/i) || [];
  if (limit && parseInt(limit, 10) > 10000) {
    errors.push(
      "Spoke currently does not support LIMIT statements of higher than 10000"
    );
  }
  const requiredFields = ["first_name", "last_name", "cell"];
  requiredFields.forEach((f) => {
    if (sql.indexOf(f) === -1) {
      errors.push(`"${f}" is a required column`);
    }
  });
  if (sql.indexOf(";") >= 0) {
    errors.push('Do not include a trailing (or any) ";"');
  }

  return errors;
};

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
    padding: 3
  }
});

class ContactsSqlForm extends React.Component<
  ContactsSqlProps & { style?: React.CSSProperties },
  ContactsSqlState
> {
  state = {
    pendingSql: "",
    sqlError: undefined
  };

  handleSqlTextChange = (_ev: React.FormEvent<unknown>, pendingSql: string) => {
    this.setState({ pendingSql });
    const errors = validateSql(pendingSql);

    if (errors.length > 0) {
      this.setState({ sqlError: errors.join(", ") });
      this.props.onChangeValidSql(null);
    } else {
      this.setState({ sqlError: undefined });
      this.props.onChangeValidSql(pendingSql);
    }
  };

  render() {
    const { pendingSql, sqlError } = this.state;
    return (
      <div style={this.props.style}>
        Instead of uploading contacts, as a super-admin, you can also create a
        SQL query directly from the data warehouse that will load in contacts.
        The SQL requires some constraints:
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
            <span className={css(styles.csvHeader)}>as field_name</span>{" "}
            sometimes.
          </li>
          <li>Other columns will be added to the customFields</li>
        </ul>
        <TextField
          name="contactSql"
          floatingLabelText="Data Warehouse SQL"
          hintText="Enter your query here"
          errorText={sqlError}
          value={pendingSql}
          fullWidth
          multiLine
          rows={5}
          onChange={this.handleSqlTextChange}
        />
      </div>
    );
  }
}

export default ContactsSqlForm;
